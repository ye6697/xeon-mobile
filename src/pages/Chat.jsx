import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Send, Plus, ArrowLeft, Paperclip, Image, FileText,
  Loader2, Bot, User, Trash2, MoreVertical
} from "lucide-react";
import XeonLogo from "@/components/xeon/XeonLogo";
import GlassCard from "@/components/xeon/GlassCard";
import BottomNav from "@/components/xeon/BottomNav";
import { buildXeonSystemPrompt, extractXeonAction, runXeonAction, createSyncEvent, XEON_MODEL } from "@/lib/xeonCore";

export default function Chat() {
  const { conversationId } = useParams();

  if (conversationId) return <ChatConversation conversationId={conversationId} />;
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex flex-col">
      <div className="safe-top" />
      <div className="flex-1 pb-20">
        <ChatList />
      </div>
      <BottomNav />
    </div>
  );
}

function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Conversation.list("-updated_date", 50)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  const createNew = async () => {
    const conv = await base44.entities.Conversation.create({
      title: "Neues Gespräch",
      source: "mobile",
    });
    navigate(`/chat/${conv.id}`);
  };

  const deleteConv = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    await base44.entities.Conversation.delete(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between pt-3 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Gespräche</h1>
          <p className="text-[10px] text-neutral-500 tracking-wide">{conversations.length} Konversationen</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={createNew}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #8B1A1A, #5a1010)",
            boxShadow: "0 0 15px rgba(139,26,26,0.3)",
          }}
        >
          <Plus size={18} className="text-white" />
        </motion.button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-neutral-700 border-t-red-700 rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-neutral-900 xeon-border-glow">
            <Bot size={28} className="text-red-700" />
          </div>
          <p className="text-sm font-medium text-neutral-400">Keine Gespräche</p>
          <p className="text-xs text-neutral-600 mt-1 mb-6">Starte eine neue Unterhaltung mit XEON</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={createNew}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #8B1A1A, #5a1010)" }}
          >
            Neues Gespräch
          </motion.button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={`/chat/${conv.id}`}>
                <GlassCard className="flex items-center gap-3" animate={false}>
                  <div className="w-9 h-9 rounded-xl bg-neutral-800/60 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{conv.title}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{conv.last_message || "Kein Inhalt"}</p>
                  </div>
                  <button onClick={(e) => deleteConv(e, conv.id)} className="p-2 text-neutral-600 active:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatConversation({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conv, setConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const didInitialScroll = useRef(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const loadConversation = async () => {
    const [c, m] = await Promise.all([
      base44.entities.Conversation.get(conversationId),
      base44.entities.Message.filter({ conversation_id: conversationId }, "created_date", 200),
    ]);
    setConv(c);
    setMessages(m);
    setLoading(false);
  };

  useEffect(() => {
    loadConversation();
    const timer = window.setInterval(loadConversation, 3500);
    return () => window.clearInterval(timer);
  }, [conversationId]);

  useEffect(() => {
    // Nur einmal beim Öffnen des Chats nach unten scrollen
    if (!loading && !didInitialScroll.current && scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      didInitialScroll.current = true;
    }
  }, [loading, messages]);

  const syncConversationMessage = async (message) => {
    await createSyncEvent({
      event_type: "mobile_message",
      target: "desktop",
      ai_processing_mode: "none",
      payload: {
        conversation_id: conversationId,
        message_id: message.id,
        role: message.role,
        text: message.content,
        file_urls: message.file_urls || "",
        action_type: message.file_urls ? "FILE" : "CHAT",
        source: "mobile",
      },
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);

    const userMessage = await base44.entities.Message.create({
      conversation_id: conversationId,
      role: "user",
      content: userMsg,
      source: "mobile",
      ai_processing_mode: "none",
    });
    setMessages((prev) => [...prev, userMessage]);
    await syncConversationMessage(userMessage);

    await base44.entities.Conversation.update(conversationId, {
      last_message: userMsg,
      message_count: messages.length + 1,
      title: messages.length < 2 ? userMsg.slice(0, 60) : conv?.title,
    });
    const mems = await base44.entities.Memory.filter({ is_active: true }, "-priority", 20);
    const systemPrompt = buildXeonSystemPrompt(mems);
    const recentMsgs = messages.slice(-10).map((m) => `${m.role === "user" ? "Nutzer" : "XEON"}: ${m.content}`).join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      model: XEON_MODEL,
      prompt: `${systemPrompt}\n\nGesprächsverlauf:\n${recentMsgs}\n\nNutzer: ${userMsg}\n\nXEON:`,
    });
    const { cleanText, action } = extractXeonAction(response);
    const finalResponse = await runXeonAction(action, cleanText);

    const assistantMessage = await base44.entities.Message.create({
      conversation_id: conversationId,
      role: "assistant",
      content: finalResponse,
      source: "mobile",
      ai_processing_mode: "none",
    });
    setMessages((prev) => [...prev, assistantMessage]);
    await syncConversationMessage(assistantMessage);

    await base44.entities.Conversation.update(conversationId, {
      last_message: userMsg,
      message_count: messages.length + 2,
      title: messages.length < 2 ? userMsg.slice(0, 60) : conv?.title,
    });

    setSending(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const userMessage = await base44.entities.Message.create({
      conversation_id: conversationId,
      role: "user",
      content: `📎 Datei hochgeladen: ${file.name}`,
      file_urls: file_url,
      source: "mobile",
      ai_processing_mode: "none",
    });
    setMessages((prev) => [...prev, userMessage]);
    await syncConversationMessage(userMessage);

    const mems = await base44.entities.Memory.filter({ is_active: true }, "-priority", 20);
    const response = await base44.integrations.Core.InvokeLLM({
      model: XEON_MODEL,
      prompt: `${buildXeonSystemPrompt(mems)}\n\nDer Nutzer hat eine Datei hochgeladen: ${file.name}. Analysiere sie präzise im Stil von XEON und gib eine hilfreiche Zusammenfassung.`,
      file_urls: [file_url],
    });

    const assistantMessage = await base44.entities.Message.create({
      conversation_id: conversationId,
      role: "assistant",
      content: response,
      source: "mobile",
      ai_processing_mode: "none",
    });
    setMessages((prev) => [...prev, assistantMessage]);
    await syncConversationMessage(assistantMessage);
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0a0a0a]">
      {/* Header */}
      <div className="safe-top bg-[#0a0a0a]" />
      <div className="xeon-glass-strong px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate("/chat")} className="p-1">
          <ArrowLeft size={20} className="text-neutral-400" />
        </button>
        <XeonLogo size={28} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{conv?.title || "XEON"}</p>
          <p className="text-[10px] text-neutral-500">
            {sending ? "XEON denkt..." : "bereit"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-neutral-700 border-t-red-700 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <XeonLogo size={48} />
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-400">XEON bereit</p>
              <p className="text-xs text-neutral-600 mt-1">Was kann ich für dich tun?</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id || i} message={msg} />
            ))}
          </AnimatePresence>
        )}
        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2"
          >
            <div className="w-6 h-6 rounded-lg bg-red-900/20 flex items-center justify-center">
              <Loader2 size={12} className="text-red-500 animate-spin" />
            </div>
            <span className="text-xs text-neutral-500">Desktop-XEON wird synchronisiert...</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="xeon-glass-strong px-3 py-2 safe-bottom">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <label className="p-2 text-neutral-500 active:text-red-500 cursor-pointer flex-shrink-0">
            <Paperclip size={18} />
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
          <div className="flex-1 rounded-xl bg-neutral-900/80 border border-neutral-800 px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Nachricht an XEON..."
              rows={1}
              className="w-full bg-transparent text-sm text-white placeholder-neutral-600 resize-none outline-none max-h-32"
              style={{ minHeight: "20px" }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="p-2 rounded-xl flex-shrink-0 disabled:opacity-30"
            style={{
              background: input.trim() && !sending
                ? "linear-gradient(135deg, #8B1A1A, #5a1010)"
                : "transparent",
            }}
          >
            <Send size={18} className={input.trim() && !sending ? "text-white" : "text-neutral-600"} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isUser ? "text-white" : "xeon-glass text-neutral-200"
        }`}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, rgba(139,26,26,0.85) 0%, rgba(58,10,10,0.95) 100%)",
                border: "1px solid rgba(139,26,26,0.4)",
                boxShadow: "0 0 20px rgba(139,26,26,0.15)",
              }
            : {
                border: "1px solid rgba(139,26,26,0.15)",
                boxShadow: "inset 0 0 20px rgba(139,26,26,0.03)",
              }
        }
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-4 h-4 rounded bg-red-900/30 flex items-center justify-center">
              <Bot size={10} className="text-red-500" />
            </div>
            <span className="text-[9px] text-red-600 font-semibold tracking-wider uppercase">XEON</span>
          </div>
        )}
        <div className="text-sm leading-relaxed">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_code]:bg-neutral-700/50 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-neutral-900/50 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto">
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </motion.div>
  );
}