"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import ChatView from "@/components/chat/ChatView";
import FloatingActionButton from "@/components/chat/FloatingActionButton";
import HistoryPanel from "@/components/chat/HistoryPanel";
import SettingsView from "@/components/settings/SettingsView";

export type ActiveView = "Chats" | "Search" | "Favorites" | "Files" | "History" | "Settings";

function PlaceholderView({ view }: { view: ActiveView }) {
  const icons: Record<string, string> = {
    Search: "🔍",
    Favorites: "⭐",
    Files: "📁",
    Settings: "⚙️",
  };
  return (
    <motion.div
      key={view}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center gap-3 text-[#64748B] h-full"
    >
      <span className="text-5xl">{icons[view]}</span>
      <p className="text-xl font-medium text-[#94A3B8]">{view}</p>
      <p className="text-sm text-[#475569]">This section is coming soon.</p>
    </motion.div>
  );
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="absolute right-3 sm:right-6 top-[80px] sm:top-[88px] z-50 w-[calc(100vw-24px)] max-w-[320px] rounded-2xl bg-[#0D1117] border border-white/10 shadow-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#F8FAFC] font-semibold text-sm">Notifications</span>
        <button onClick={onClose} className="text-[#64748B] hover:text-[#F8FAFC] text-xs transition-colors">
          Close
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {["New model update available", "Your session was saved", "Welcome to Marg AI!"].map((msg, i) => (
          <div key={i} className="text-[13px] text-[#94A3B8] bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
            {msg}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const handleItem = (item: string) => {
    if (item === "Edit Profile") {
      onClose();
      router.push("/profile/edit");
    } else if (item === "Sign Out") {
      onClose();
      // Sign out via Supabase
      import("@/utils/supabase/client").then(({ createClient }) => {
        createClient().auth.signOut().then(() => {
          // Clear local state
          window.location.href = "/login";
        });
      });
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-4 left-4 md:bottom-[72px] md:left-[96px] z-50 w-[220px] rounded-2xl bg-[#0D1117] border border-white/10 shadow-2xl p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full border border-[#00D9FF]/40 text-[#00D9FF] flex items-center justify-center font-medium bg-transparent">
          R
        </div>
        <div>
          <p className="text-[#F8FAFC] text-sm font-medium">Rahul</p>
          <p className="text-[#64748B] text-xs">rahul@example.com</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {["Edit Profile", "Switch Account", "Sign Out"].map((item, i) => (
          <button
            key={i}
            onClick={() => handleItem(item)}
            className={`text-left text-[13px] hover:text-[#F8FAFC] hover:bg-white/5 rounded-lg px-3 py-2 transition-colors ${
              item === "Sign Out" ? "text-[#EF4444] hover:text-[#EF4444]" : "text-[#94A3B8]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const mockUserName = "Rahul";
  const [activeView, setActiveView] = useState<ActiveView>("Chats");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [chatKey, setChatKey] = useState(0); // increment to remount ChatView (reset messages + session)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // CRITICAL FIX: Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not authenticated - redirect to login
        router.push("/login");
        return;
      }
      
      setIsAuthenticated(true);
    };
    
    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#050608]">
        <div className="w-12 h-12 border-3 border-[#00D9FF]/30 border-t-[#00D9FF] rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, don't render the main UI
  if (!isAuthenticated) {
    return null;
  }

  const showHistoryPanel = activeView === "History";

  const handleNewChat = () => {
    // Save current chat to history (if one exists) by refreshing the history list,
    // then reset the chat by remounting ChatView with a new key.
    setHistoryRefresh((p) => p + 1);
    setChatKey((p) => p + 1);
    setSelectedSessionId(null);
    // Open the History panel so users can see previous and the current (just-saved) chats.
    setActiveView("History");
    setShowNotifications(false);
    setShowProfile(false);
  };

  const handleSelectChat = (id: string) => {
    // CRITICAL FIX: Don't increment chatKey when selecting existing chat
    // This was causing the component to remount and lose the session context
    setSelectedSessionId(id);
    setActiveView("Chats"); // switch back to chat view
  };

  const handleViewChange = (view: ActiveView) => {
    // Clicking History again while open → close it back to Chats
    if (view === "History" && activeView === "History") {
      setActiveView("Chats");
    } else {
      setActiveView(view);
    }
    setShowNotifications(false);
    setShowProfile(false);
  };

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowProfile(false);
  };

  const handleToggleProfile = () => {
    setShowProfile((prev) => !prev);
    setShowNotifications(false);
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex justify-center bg-transparent">
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex w-full h-full max-w-[1600px] relative shadow-2xl"
      >
        {/* Sidebar (Left) */}
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          onToggleNotifications={handleToggleNotifications}
          onToggleProfile={handleToggleProfile}
          showProfile={showProfile}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-row relative h-full overflow-hidden">

          {/* Chat + other views */}
          <div className="flex-1 flex flex-col relative h-full">
            {/* Top Bar */}
            <TopBar
              onNewChat={handleNewChat}
              onViewChange={handleViewChange}
              onToggleNotifications={handleToggleNotifications}
              onToggleProfile={handleToggleProfile}
              onToggleTheme={handleToggleTheme}
              isDark={isDark}
            />

            {/* Notification overlay */}
            <AnimatePresence>
              {showNotifications && (
                <NotificationsPanel onClose={() => setShowNotifications(false)} />
              )}
            </AnimatePresence>

            {/* Center Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full pt-[80px] md:pt-[96px]">
              <AnimatePresence mode="wait">
                {activeView === "Chats" || activeView === "History" ? (
                  <motion.div
                    key="chats"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 flex flex-col h-full w-full"
                  >
                    <ChatView
                      key={chatKey}
                      userName={mockUserName}
                      sessionId={selectedSessionId}
                      onSessionCreated={() => setHistoryRefresh(p => p + 1)}
                    />
                  </motion.div>
                ) : activeView === "Settings" ? (
                  <SettingsView
                    key="settings"
                    isDark={isDark}
                    onToggleTheme={handleToggleTheme}
                  />
                ) : (
                  <PlaceholderView key={activeView} view={activeView} />
                )}
              </AnimatePresence>
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton />
          </div>

          {/* History Panel — always mounted so refreshTrigger works; hidden when not active */}
          <HistoryPanel
            refreshTrigger={historyRefresh}
            onSelectChat={handleSelectChat}
            visible={showHistoryPanel}
          />
        </div>

        {/* Profile panel */}
        <AnimatePresence>
          {showProfile && (
            <ProfilePanel onClose={() => setShowProfile(false)} />
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
