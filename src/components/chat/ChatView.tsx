"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Paperclip, Image as ImageIcon, Sparkles, Mic, ArrowUp,
  Play, ExternalLink, X, Copy, RefreshCw, ThumbsUp, ThumbsDown
} from "lucide-react";
import RichMarkdown from "./RichMarkdown";

interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  youtubeVideo?: YouTubeVideo | null;
  imageUrl?: string | null;
  timestamp?: Date;
}

interface ChatViewProps {
  userName: string;
  sessionId?: string | null;
  onSessionCreated?: () => void;
  isAuthenticated?: boolean;
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="ai-card p-6 w-full" style={{ maxWidth: "900px" }}>
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #00E5FF, #4DA6FF)" }}
          >
            M
          </div>
          <span className="text-[14px] font-semibold text-white">Marg AI</span>
        </div>
      </div>
      <div className="flex gap-1.5 items-center px-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: "#00E5FF" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Image Generating Indicator ───────────────────────────────────────────────

function ImageGeneratingIndicator() {
  return (
    <div className="ai-card p-6 w-full" style={{ maxWidth: "900px" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #00E5FF, #4DA6FF)" }}
          >
            M
          </div>
          <span className="text-[14px] font-semibold text-white">Marg AI</span>
        </div>
      </div>
      <div className="flex items-center gap-3 px-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse"
          style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}
        >
          <ImageIcon className="w-4 h-4" style={{ color: "#00E5FF" }} />
        </div>
        <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
          Generating image...
        </span>
      </div>
    </div>
  );
}

// ─── YouTube Card ─────────────────────────────────────────────────────────────

function YouTubeCard({ video }: { video: YouTubeVideo }) {
  return (
    <motion.a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="flex flex-col sm:flex-row gap-3 mt-4 rounded-[14px] overflow-hidden transition-all duration-200 group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,229,255,0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div className="relative w-full sm:w-[120px] shrink-0 overflow-hidden" style={{ minHeight: "120px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" style={{ minHeight: "120px" }} />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center shadow-lg">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-1 py-2 px-3 sm:pr-3 sm:pl-0 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#FF0000] uppercase tracking-wide">YouTube</span>
          <ExternalLink className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
        </div>
        <p className="text-[12px] font-medium text-[#F8FAFC] line-clamp-2 leading-snug group-hover:text-[#00E5FF] transition-colors">
          {video.title}
        </p>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{video.channelTitle}</p>
      </div>
    </motion.a>
  );
}

// ─── Content Serialization — persists rich media in the TEXT column ──────────
// Format: "<markdown text>\n\n__MARG_META__<json>"
// Backward compatible: messages without __MARG_META__ are plain content.

interface MessageMeta {
  youtubeVideo?: YouTubeVideo | null;
  imageUrl?: string | null;
}

function serializeContent(text: string, meta: MessageMeta): string {
  // Only append meta if there is something worth persisting
  const hasMeta = meta.youtubeVideo || meta.imageUrl;
  if (!hasMeta) return text;
  return `${text}\n\n__MARG_META__${JSON.stringify(meta)}`;
}

function deserializeContent(raw: string): { content: string; meta: MessageMeta } {
  const marker = "\n\n__MARG_META__";
  const idx = raw.indexOf(marker);
  if (idx === -1) return { content: raw, meta: {} };
  const content = raw.slice(0, idx);
  try {
    const meta: MessageMeta = JSON.parse(raw.slice(idx + marker.length));
    return { content, meta };
  } catch {
    // Corrupt meta — return raw content with no meta
    return { content: raw, meta: {} };
  }
}

// ─── Format Timestamp ─────────────────────────────────────────────────────────

function formatTime(date?: Date): string {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── AI Message Card ──────────────────────────────────────────────────────────

function AIMessageCard({
  msg,
  isNew,
  onRegenerate,
}: {
  msg: Message;
  isNew?: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<"up" | "down" | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full"
    >
      <div
        className="ai-card w-full"
        style={{ padding: "clamp(16px,4vw,28px) clamp(16px,4vw,32px)" }}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #00E5FF, #4DA6FF)" }}
            >
              M
            </div>
            <span className="text-[14px] font-semibold text-white">Marg AI</span>
          </div>
          {msg.timestamp && (
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {formatTime(msg.timestamp)}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="mb-5">
          {/* Generated image */}
          {msg.imageUrl && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={msg.imageUrl}
                alt="Generated image"
                className="rounded-[14px] w-full max-w-[400px]"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </motion.div>
          )}

          {msg.content && (
            <RichMarkdown content={msg.content} animate={isNew} />
          )}

          {msg.youtubeVideo && <YouTubeCard video={msg.youtubeVideo} />}
        </div>

        {/* Card Footer — action buttons */}
        <div
          className="flex flex-wrap items-center gap-1 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <ActionButton
            icon={<Copy className="w-3.5 h-3.5" />}
            label={copied ? "Copied!" : "Copy"}
            active={copied}
            onClick={handleCopy}
          />
          <ActionButton
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            label="Regenerate"
            onClick={onRegenerate}
          />
          <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
          <ActionButton
            icon={<ThumbsUp className="w-3.5 h-3.5" />}
            label="Good"
            active={liked === "up"}
            onClick={() => setLiked(liked === "up" ? null : "up")}
          />
          <ActionButton
            icon={<ThumbsDown className="w-3.5 h-3.5" />}
            label="Bad"
            active={liked === "down"}
            activeColor="#FF5C5C"
            onClick={() => setLiked(liked === "down" ? null : "down")}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  active,
  activeColor = "#00E5FF",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150"
      style={{
        color: active ? activeColor : "rgba(255,255,255,0.4)",
        background: active ? `${activeColor}14` : "transparent",
        border: `1px solid ${active ? `${activeColor}30` : "transparent"}`,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Input Bar ────────────────────────────────────────────────────────────────

function InputBar({
  input,
  isFocused,
  isLoading,
  isRateLimited,
  isAuthenticated,
  imageMode,
  onInput,
  onKeyDown,
  onFocus,
  onBlur,
  onSubmit,
  onToggleImageMode,
  autoFocus,
  onLoginClick,
}: {
  input: string;
  isFocused: boolean;
  isLoading: boolean;
  isRateLimited: boolean;
  isAuthenticated: boolean;
  imageMode: boolean;
  onInput: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
  onToggleImageMode: () => void;
  autoFocus?: boolean;
  onLoginClick?: () => void;
}) {
  // When not authenticated, show a locked/disabled state with login prompt
  if (!isAuthenticated) {
    return (
      <div
        className="w-full min-h-[60px] sm:h-[68px] rounded-[40px] px-4 sm:px-6 flex items-center gap-3 glass-card card-shadow"
        style={{ opacity: 0.8 }}
      >
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <p className="text-[13px] sm:text-[14px] text-[#64748B] text-center">
            Sign in to start chatting with Marg AI
          </p>
          <div className="flex gap-2">
            <button
              onClick={onLoginClick}
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#00D9FF] transition-all duration-200 hover:bg-[#00D9FF]/10"
              style={{ border: "1px solid rgba(0,217,255,0.4)" }}
            >
              Log In
            </button>
            <button
              onClick={() => window.location.href = "/signup"}
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#050608] transition-all duration-200"
              style={{ background: "#00D9FF" }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-[60px] sm:h-[68px] rounded-[40px] px-3 sm:px-6 flex items-center gap-2 sm:gap-4 transition-all duration-300 glass-card ${
        isFocused
          ? imageMode
            ? "border-[#00E5FF]/60 shadow-[0_0_20px_rgba(0,229,255,0.2)]"
            : "border-[#00E5FF]/40 glow-neon"
          : "card-shadow hover:border-[#00E5FF]/20"
      }`}
    >
      <button className="text-[#64748B] hover:text-[#F8FAFC] transition-colors p-2 rounded-full hover:bg-white/5 shrink-0">
        <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
      </button>
      <input
        type="text"
        value={input}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={imageMode ? "Describe the image to generate..." : "Ask anything..."}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#F8FAFC] placeholder:text-[#64748B] text-[14px] sm:text-[16px] font-medium"
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={isLoading || isRateLimited}
        autoFocus={autoFocus}
      />
      <div className="flex items-center gap-0.5 sm:gap-1.5 text-[#64748B] shrink-0">
        <button className="p-2 sm:p-2.5 hover:text-[#F8FAFC] transition-colors rounded-full hover:bg-white/5">
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
        </button>
        <motion.button
          onClick={onToggleImageMode}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 ${
            imageMode
              ? "text-[#00E5FF] bg-[#00E5FF]/12 shadow-[0_0_12px_rgba(0,229,255,0.35)]"
              : "text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/5"
          }`}
          title={imageMode ? "Exit Image Mode" : "Image Generation Mode"}
        >
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
        </motion.button>
        <button className="hidden sm:block p-2.5 text-[#00E5FF] hover:text-[#67E8F9] transition-colors rounded-full hover:bg-[#00E5FF]/10 glow-shadow">
          <Sparkles className="w-5 h-5" strokeWidth={2} />
        </button>
        <div className="hidden sm:block w-px h-6 bg-white/10 mx-2" />
        {input.trim() ? (
          <button
            onClick={onSubmit}
            disabled={isLoading || isRateLimited}
            className="p-2 sm:p-2.5 text-[#00E5FF] hover:text-[#67E8F9] transition-colors rounded-full hover:bg-[#00E5FF]/10 disabled:opacity-50"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
          </button>
        ) : (
          <button className="p-2 sm:p-2.5 hover:text-[#F8FAFC] transition-colors rounded-full hover:bg-white/5">
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

function UserMessage({ msg, isNew }: { msg: Message; isNew?: boolean }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-end w-full"
    >
      <div className="flex flex-col items-end gap-1.5" style={{ maxWidth: "min(72%, calc(100% - 16px))" }}>
        <span className="text-[11px] font-medium px-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          You{msg.timestamp ? ` • ${formatTime(msg.timestamp)}` : ""}
        </span>
        <div
          className="px-5 py-3.5 rounded-[18px] rounded-tr-[6px]"
          style={{
            background: "rgba(0,229,255,0.07)",
            border: "1px solid rgba(0,229,255,0.2)",
            boxShadow: "0 4px 24px rgba(0,229,255,0.06)",
          }}
        >
          <p
            className="text-[15px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            {msg.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ChatView ────────────────────────────────────────────────────────────

export default function ChatView({ userName, sessionId, onSessionCreated }: ChatViewProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // optimistic
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const pendingRetryRef = useRef<{ userMsg: Message; newMessages: Message[]; activeSessionId: string | null } | null>(null);
  // CRITICAL FIX: Initialize currentSessionId from the sessionId prop
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestMessagesRef = useRef<Message[]>(messages);
  const latestSessionRef = useRef<string | null>(currentSessionId);

  useEffect(() => { latestMessagesRef.current = messages; }, [messages]);
  useEffect(() => { latestSessionRef.current = currentSessionId; }, [currentSessionId]);

  // Load messages when a past session is selected OR when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      // No session selected - this is a new chat
      setMessages([]);
      setCurrentSessionId(null);
      return;
    }
    
    // CRITICAL FIX: Set the currentSessionId immediately when sessionId changes
    // This prevents creating a new session when continuing an existing conversation
    setCurrentSessionId(sessionId);
    setIsLoading(true);
    
    fetch(`/api/chat/messages?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        const loaded: Message[] = (data.messages ?? []).map(
          (m: { id: string; role: "user" | "assistant"; content: string }) => {
            // Deserialize rich media (youtubeVideo, imageUrl) that was packed into content
            const { content, meta } = deserializeContent(m.content);
            return {
              id: m.id,
              role: m.role,
              content,
              youtubeVideo: meta.youtubeVideo ?? null,
              imageUrl: meta.imageUrl ?? null,
            };
          }
        );
        setMessages(loaded);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Countdown timer — auto-retries the pending message when it reaches 0
  useEffect(() => {
    if (retryCountdown === null) return;
    if (retryCountdown > 0) {
      const t = setTimeout(() => setRetryCountdown((c) => (c !== null ? c - 1 : null)), 1000);
      return () => clearTimeout(t);
    }
    const pending = pendingRetryRef.current;
    if (!pending) { setRetryCountdown(null); return; }
    pendingRetryRef.current = null;
    setRetryCountdown(null);

    setMessages((prev) => prev.filter((m) => !m.content.includes("Rate limit reached")));

    const { newMessages, activeSessionId } = pending;
    setIsLoading(true);

    (async () => {
      try {
        const geminiRes = await fetch("/api/chat/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        });
        const { response, error, youtubeVideo, rateLimited, retryAfter } = await geminiRes.json();

        if (rateLimited) {
          const waitSecs = retryAfter ?? 60;
          pendingRetryRef.current = { userMsg: pending.userMsg, newMessages, activeSessionId };
          setRetryCountdown(waitSecs);
          setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `⏳ Rate limit reached. Retrying automatically in **${waitSecs}s**...`,
            timestamp: new Date(),
          }]);
          setIsLoading(false);
          return;
        }

        if (error) throw new Error(error);

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          youtubeVideo: youtubeVideo ?? null,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (activeSessionId) {
          await fetch("/api/chat/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: activeSessionId,
              role: "assistant",
              // Serialize youtubeVideo into content so it survives DB round-trip
              content: serializeContent(response, { youtubeVideo: youtubeVideo ?? null }),
            }),
          });
        }
      } catch (err) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        }]);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [retryCountdown]);

  // --- Image generation ---
  const handleImageGenerate = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!input.trim() || isLoading) return;
    const prompt = input.trim();

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: `🎨 ${prompt}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          imageUrl: data.imageUrl,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `❌ ${err instanceof Error ? err.message : "Image generation failed. Please try again."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Text chat ---
  const handleSubmit = async () => {
    // CRITICAL FIX: Block unauthenticated users from submitting
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!input.trim() || isLoading) return;
    if (imageMode) { await handleImageGenerate(); return; }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        const sessionRes = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: userMsg.content.slice(0, 80) }),
        });
        const { session } = await sessionRes.json();
        if (session?.id) {
          activeSessionId = session.id;
          setCurrentSessionId(session.id);
          onSessionCreated?.();
        }
      }

      if (activeSessionId) {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: activeSessionId, role: "user", content: userMsg.content }),
        });
      }

      const geminiRes = await fetch("/api/chat/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const { response, error, youtubeVideo, rateLimited, retryAfter } = await geminiRes.json();

      if (rateLimited) {
        const waitSecs = retryAfter ?? 60;
        pendingRetryRef.current = { userMsg, newMessages, activeSessionId };
        setRetryCountdown(waitSecs);
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `⏳ Rate limit reached. Retrying automatically in **${waitSecs}s**...`,
          timestamp: new Date(),
        }]);
        setIsLoading(false);
        return;
      }

      if (error) throw new Error(error);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        youtubeVideo: youtubeVideo ?? null,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (activeSessionId) {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: activeSessionId,
            role: "assistant",
            // Serialize youtubeVideo into content so it survives DB round-trip
            content: serializeContent(response, { youtubeVideo: youtubeVideo ?? null }),
          }),
        });
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      }]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // CRITICAL FIX: Block Enter key for unauthenticated users
    if (!isAuthenticated) { e.preventDefault(); return; }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const isRateLimited = retryCountdown !== null && retryCountdown > 0;
  const showWelcome = messages.length === 0;

  const sharedInputProps = {
    input,
    isFocused,
    isLoading,
    isRateLimited,
    isAuthenticated,
    imageMode,
    onInput: setInput,
    onKeyDown: handleKeyDown,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    onSubmit: handleSubmit,
    onToggleImageMode: () => setImageMode((p) => !p),
    onLoginClick: () => router.push("/login"),
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 sm:px-4 pt-4">
        {showWelcome ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center gap-8 pb-8"
          >
            <div>
              <h1 className="hero-text text-[#F8FAFC] tracking-tight mb-3">
                Hello! What&apos;s up, I am Marg AI <span className="inline-block animate-wave">👋</span>
              </h1>
              <p className="body-text text-[#94A3B8]">How can I help you today?</p>
            </div>
            <div className="w-full max-w-2xl">
              <InputBar {...sharedInputProps} autoFocus />
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-5 pb-4 w-full mx-auto" style={{ maxWidth: "900px" }}>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isNew = i === messages.length - 1;
                if (msg.role === "user") {
                  return <UserMessage key={msg.id} msg={msg} isNew={isNew} />;
                }
                return (
                  <AIMessageCard
                    key={msg.id}
                    msg={msg}
                    isNew={isNew}
                    onRegenerate={undefined}
                  />
                );
              })}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                {imageMode ? <ImageGeneratingIndicator /> : <TypingIndicator />}
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Rate limit countdown banner */}
      <AnimatePresence>
        {isRateLimited && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mx-2 sm:mx-4 mb-1 flex items-center justify-between px-3 sm:px-4 py-2 rounded-[12px] text-[11px] sm:text-[12px] font-medium"
            style={{ background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.25)" }}
          >
            <span style={{ color: "#FF5C5C" }}>⏳ Rate limited — ready again in {retryCountdown}s</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image mode banner */}
      <AnimatePresence>
        {imageMode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mx-2 sm:mx-4 mb-1 flex items-center justify-between px-3 sm:px-4 py-2 rounded-[12px] text-[11px] sm:text-[12px] font-medium"
            style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)" }}
          >
            <div className="flex items-center gap-2" style={{ color: "#00E5FF" }}>
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">Image Generation Mode — describe what you want to generate</span>
            </div>
            <button onClick={() => setImageMode(false)} className="hover:text-[#F8FAFC] transition-colors ml-2 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom input bar */}
      {!showWelcome && (
        <div className="shrink-0 px-2 sm:px-4 pb-4 sm:pb-6 pt-1 flex justify-center">
          <div className="w-full" style={{ maxWidth: "900px" }}>
            <InputBar {...sharedInputProps} />
          </div>
        </div>
      )}
    </div>
  );
}
