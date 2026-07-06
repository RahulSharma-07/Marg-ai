"use client";

import { motion } from "framer-motion";
import { Plus, Paperclip, Image as ImageIcon, Sparkles, Mic, ArrowUp } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSessionCreated?: (sessionId: string) => void;
}

export default function ChatInput({ onSessionCreated }: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      // Create a new session with the first message as the title
      const sessionRes = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: message.trim().slice(0, 80) }),
      });
      const { session } = await sessionRes.json();

      if (session?.id) {
        // Save the user message
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: session.id,
            role: "user",
            content: message.trim(),
          }),
        });

        onSessionCreated?.(session.id);
        setMessage("");
      }
    } catch (err) {
      console.error("Failed to save chat:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`w-full max-w-3xl h-[68px] rounded-[40px] px-6 flex items-center gap-4 transition-all duration-300 glass-card ${
        isFocused ? "border-[#00D9FF]/40 glow-neon" : "card-shadow hover:border-[#00D9FF]/20"
      }`}
    >
      {/* Plus Button */}
      <button className="text-[#64748B] hover:text-[#F8FAFC] transition-colors p-2 rounded-full hover:bg-white/5">
        <Plus className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Input Field */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="flex-1 bg-transparent border-none outline-none text-[#F8FAFC] placeholder:text-[#64748B] text-[16px] font-medium"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={isSending}
      />

      {/* Action Icons */}
      <div className="flex items-center gap-1.5 text-[#64748B]">
        <button className="p-2.5 hover:text-[#F8FAFC] transition-colors rounded-full hover:bg-white/5">
          <Paperclip className="w-5 h-5" strokeWidth={2} />
        </button>
        <button className="p-2.5 hover:text-[#F8FAFC] transition-colors rounded-full hover:bg-white/5">
          <ImageIcon className="w-5 h-5" strokeWidth={2} />
        </button>
        <button className="p-2.5 text-[#00D9FF] hover:text-[#67E8F9] transition-colors rounded-full hover:bg-[#00D9FF]/10 glow-shadow">
          <Sparkles className="w-5 h-5" strokeWidth={2} />
        </button>
        <div className="w-px h-6 bg-white/10 mx-2" />
        {message.trim() ? (
          <button
            onClick={handleSubmit}
            disabled={isSending}
            className="p-2.5 text-[#00D9FF] hover:text-[#67E8F9] transition-colors rounded-full hover:bg-[#00D9FF]/10 disabled:opacity-50"
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2} />
          </button>
        ) : (
          <button className="p-2.5 hover:text-[#F8FAFC] transition-colors rounded-full hover:bg-white/5">
            <Mic className="w-5 h-5" strokeWidth={2} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
