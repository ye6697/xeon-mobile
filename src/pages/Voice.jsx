import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, Volume2, Loader2, X } from "lucide-react";
import PulseRing from "@/components/xeon/PulseRing";
import XeonLogo from "@/components/xeon/XeonLogo";
import BottomNav from "@/components/xeon/BottomNav";
import ReactMarkdown from "react-markdown";

const STATUS_LABELS = {
  idle: "Tippe zum Sprechen",
  listening: "Hört zu...",
  thinking: "Denkt nach...",
  speaking: "Antwortet...",
};

export default function Voice() {
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startListening = async () => {
    setTranscript("");
    setResponse("");
    setStatus("listening");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], "voice.webm", { type: "audio/webm" });

      setStatus("thinking");

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const transcriptResult = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
      setTranscript(transcriptResult);

      const mems = await base44.entities.Memory.filter({ is_active: true }, "-priority", 10);
      let memCtx = "";
      if (mems.length > 0) {
        memCtx = "\n\nKontext:\n" + mems.map((m) => `- ${m.title}: ${m.content}`).join("\n");
      }

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist XEON – ein fortschrittlicher KI-Assistent. Antworte präzise und professionell auf Deutsch. Halte die Antwort kurz und klar, da sie vorgelesen wird.${memCtx}\n\nNutzer sagt: ${transcriptResult}\n\nXEON:`,
      });
      setResponse(aiResponse);
      setStatus("speaking");

      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.lang = "de-DE";
      utterance.rate = 1;
      utterance.onend = () => setStatus("idle");
      synth.speak(utterance);
    };

    mediaRecorder.start();
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancel = () => {
    window.speechSynthesis.cancel();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setStatus("idle");
    setTranscript("");
    setResponse("");
  };

  const toggleVoice = () => {
    if (status === "idle") startListening();
    else if (status === "listening") stopListening();
    else cancel();
  };

  const isActive = status !== "idle";

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex flex-col">
      <div className="safe-top" />
      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-24 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none transition-opacity duration-1000"
          style={{
            background: "radial-gradient(circle, rgba(139,26,26,0.12) 0%, transparent 60%)",
            opacity: isActive ? 1 : 0.3,
          }}
        />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative z-10"
        >
          <XeonLogo size={40} />
          <h1 className="text-lg font-bold text-white mt-3 tracking-tight">Voice Mode</h1>
          <p className="text-xs text-neutral-500 mt-1">Sprachsteuerung</p>
        </motion.div>

        {/* Status */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center mb-8 relative z-10"
          >
            <p className="text-sm font-medium text-red-500 xeon-glow-text tracking-wide">
              {STATUS_LABELS[status]}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Mic Button */}
        <div className="relative z-10 mb-8">
          <PulseRing isActive={isActive} size={160} />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleVoice}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: isActive
                ? "linear-gradient(135deg, #8B1A1A 0%, #DC2626 100%)"
                : "linear-gradient(135deg, #1a1a1e 0%, #2a2a2e 100%)",
              boxShadow: isActive
                ? "0 0 40px rgba(139,26,26,0.5), 0 0 100px rgba(139,26,26,0.15)"
                : "0 0 20px rgba(0,0,0,0.5)",
              border: isActive ? "2px solid rgba(220,38,38,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {status === "thinking" ? (
              <Loader2 size={28} className="text-white animate-spin" />
            ) : status === "speaking" ? (
              <Volume2 size={28} className="text-white" />
            ) : status === "listening" ? (
              <MicOff size={28} className="text-white" />
            ) : (
              <Mic size={28} className="text-neutral-300" />
            )}
          </motion.button>
        </div>

        {/* Cancel */}
        {isActive && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={cancel}
            className="mb-6 px-4 py-1.5 rounded-full bg-neutral-800/60 border border-neutral-700/30 text-xs text-neutral-400 flex items-center gap-1.5 relative z-10"
          >
            <X size={12} /> Abbrechen
          </motion.button>
        )}

        {/* Transcript & Response */}
        <div className="w-full max-w-md space-y-3 relative z-10 flex-1">
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="xeon-glass rounded-xl p-3"
            >
              <p className="text-[10px] text-neutral-500 mb-1 tracking-wider uppercase">Du</p>
              <p className="text-sm text-white">{transcript}</p>
            </motion.div>
          )}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="xeon-glass rounded-xl p-3 xeon-border-glow"
            >
              <p className="text-[10px] text-red-600 mb-1 tracking-wider uppercase font-semibold">XEON</p>
              <ReactMarkdown className="text-sm text-neutral-200 prose prose-sm prose-invert max-w-none">
                {response}
              </ReactMarkdown>
            </motion.div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}