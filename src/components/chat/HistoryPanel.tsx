"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface HistoryPanelProps {
  onSelectChat?: (id: string) => void;
  refreshTrigger?: number;
  visible?: boolean;
}

export default function HistoryPanel({
  onSelectChat,
  refreshTrigger,
  visible = true,
}: HistoryPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshTrigger]);

  useEffect(() => {
    if (visible) fetchSessions();
  }, [visible, fetchSessions]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 24, width: 0 }}
        animate={{
          opacity: visible ? 1 : 0,
          x: visible ? 0 : 24,
          width: visible ? "min(360px, 100vw)" : 0,
        }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="h-full flex flex-col overflow-hidden shrink-0 border-l border-white/10 fixed md:relative right-0 top-0 bottom-0 z-50 md:z-auto bg-[#030509] md:bg-transparent"
        style={{
          pointerEvents: visible ? "auto" : "none",
          boxShadow: visible
            ? "-1px 0 0 rgba(0,217,255,0.08), -4px 0 24px rgba(0,217,255,0.04)"
            : "none",
        }}
      >
        {/* Header */}
        <div className="pt-16 md:pt-10 pb-0 px-5 sm:px-8 shrink-0 flex items-center justify-between">
          <h2
            className="text-[30px] font-bold text-[#F8FAFC] tracking-tight"
            style={{ textShadow: "0 0 30px rgba(0,217,255,0.2)" }}
          >
            History
          </h2>
          <button
            onClick={fetchSessions}
            className="text-[#64748B] hover:text-[#00D9FF] transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 px-5 sm:px-8 mt-6 pb-8">
          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-[40px] border border-white/5 px-5 py-3 animate-pulse"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <div className="h-3 bg-white/10 rounded-full w-3/4 mb-2" />
                  <div className="h-2 bg-white/5 rounded-full w-1/4" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-8">
              <p className="text-[#EF4444] text-sm">{error}</p>
              <button
                onClick={fetchSessions}
                className="mt-3 text-[11px] text-[#00D9FF] hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sessions.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center gap-2">
              <span className="text-3xl">🕐</span>
              <p className="text-[#94A3B8] text-sm font-medium">No History</p>
              <p className="text-[#475569] text-xs">Your conversations will appear here</p>
            </div>
          )}

          {/* Sessions list */}
          {!loading &&
            !error &&
            sessions.map((session, i) => (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                onHoverStart={() => setHoveredId(session.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => onSelectChat?.(session.id)}
                whileTap={{ scale: 0.97 }}
                className="w-full text-left"
              >
                <motion.div
                  animate={{
                    backgroundColor:
                      hoveredId === session.id
                        ? "rgba(0,217,255,0.08)"
                        : "rgba(255,255,255,0.04)",
                    borderColor:
                      hoveredId === session.id
                        ? "rgba(0,217,255,0.30)"
                        : "rgba(255,255,255,0.08)",
                    boxShadow:
                      hoveredId === session.id
                        ? "0 0 20px rgba(0,217,255,0.13), inset 0 0 10px rgba(0,217,255,0.05)"
                        : "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  transition={{ duration: 0.16 }}
                  className="rounded-[40px] border px-5 py-3"
                  style={{
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  <motion.p
                    animate={{
                      color: hoveredId === session.id ? "#E2E8F0" : "#94A3B8",
                    }}
                    transition={{ duration: 0.16 }}
                    className="text-[12px] font-medium leading-snug line-clamp-2"
                  >
                    {session.title}
                  </motion.p>
                  <motion.p
                    animate={{
                      color:
                        hoveredId === session.id
                          ? "rgba(0,217,255,0.6)"
                          : "#475569",
                    }}
                    transition={{ duration: 0.16 }}
                    className="text-[10px] mt-1"
                  >
                    {timeAgo(session.updated_at)}
                  </motion.p>
                </motion.div>
              </motion.button>
            ))}
        </div>
      </motion.div>
    </>
  );
}
