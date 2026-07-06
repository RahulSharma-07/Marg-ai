"use client";

import { motion } from "framer-motion";
import { Clock, Plus, Bell, Moon, Sun, User, Settings } from "lucide-react";
import type { ActiveView } from "@/app/page";

interface TopBarProps {
  onNewChat: () => void;
  onViewChange: (view: ActiveView) => void;
  onToggleNotifications: () => void;
  onToggleProfile: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export default function TopBar({
  onNewChat,
  onViewChange,
  onToggleNotifications,
  onToggleProfile,
  onToggleTheme,
  isDark,
}: TopBarProps) {
  const rightButtons = [
    { Icon: Bell, label: "Notifications", action: onToggleNotifications },
    { Icon: isDark ? Moon : Sun, label: "Theme", action: onToggleTheme },
    { Icon: User, label: "Profile", action: onToggleProfile },
    { Icon: Settings, label: "Settings", action: () => onViewChange("Settings") },
  ];

  return (
    <header
      className="absolute top-4 md:top-6 z-10 left-[60px] right-3 md:right-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card h-[56px] md:h-[72px] rounded-full px-2 sm:px-3 md:px-4 flex items-center justify-between w-full hover:glow-shadow transition-shadow duration-500 mx-auto"
        style={{ maxWidth: "600px" }}
      >

        {/* Left: History */}
        <div className="flex items-center gap-1 md:gap-3">
          <motion.button
            onClick={() => onViewChange("History")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 md:px-5 py-2 md:py-2.5 rounded-full flex items-center gap-1.5 md:gap-2 text-[12px] md:text-[13px] text-[#F8FAFC] hover:text-[#00D9FF] hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            aria-label="View chat history"
          >
            <Clock className="w-4 h-4 stroke-[2px] shrink-0" />
            <span className="font-medium hidden sm:inline">History</span>
          </motion.button>
        </div>


        {/* Center: New Chat */}
        <motion.button
          onClick={onNewChat}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-transparent border border-[#00D9FF]/40 text-[#00D9FF] px-3 md:px-6 py-2 md:py-2.5 rounded-[14px] md:rounded-[16px] flex items-center gap-1.5 md:gap-2 text-[12px] md:text-[13px] hover:bg-[#00D9FF]/10 transition-all duration-300 glow-shadow shrink-0"
          aria-label="Start new chat"
        >
          <Plus className="w-4 h-4 stroke-[2.5px] shrink-0" />
          <span className="font-semibold hidden sm:inline">New Chat</span>
        </motion.button>

        {/* Right: Icon group */}
        <div className="flex items-center gap-0.5 md:gap-1.5">
          {rightButtons.map(({ Icon, label, action }, i) => (
            <motion.button
              key={i}
              onClick={action}
              title={label}
              aria-label={label}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors"
            >
              <Icon className="w-[17px] h-[17px] md:w-[18px] md:h-[18px] stroke-[2px]" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </header>
  );
}
