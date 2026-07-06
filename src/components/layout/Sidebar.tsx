"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Star,
  FolderOpen,
  Clock,
  Bell,
  Settings,
  LucideIcon,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { ActiveView } from "@/app/page";

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onToggleNotifications: () => void;
  onToggleProfile: () => void;
  showProfile: boolean;
}

const navItems: { icon: LucideIcon; label: ActiveView }[] = [
  { icon: Search, label: "Search" },
  { icon: MessageSquare, label: "Chats" },
  { icon: Star, label: "Favorites" },
  { icon: FolderOpen, label: "Files" },
  { icon: Clock, label: "History" },
];

const glowOn = {
  iconFilter: "drop-shadow(0 0 7px rgba(0,217,255,0.95))",
  textShadow: "0 0 8px rgba(0,217,255,0.95), 0 0 16px rgba(0,217,255,0.5)",
  bg: "rgba(0,217,255,0.10)",
  color: "#00D9FF",
};
const glowOff = {
  iconFilter: "drop-shadow(0 0 0px rgba(0,217,255,0))",
  textShadow: "0 0 0px rgba(0,217,255,0)",
  bg: "rgba(0,217,255,0)",
  color: "#64748B",
};

function NavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const lit = hovered || isActive;

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      animate={{ scale: lit ? 1.05 : 1 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col items-center justify-center gap-1.5 w-full relative py-1"
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <motion.span
        animate={{ backgroundColor: lit ? glowOn.bg : glowOff.bg }}
        transition={{ duration: 0.18 }}
        className="absolute inset-x-2 inset-y-0 rounded-xl pointer-events-none"
      />
      <motion.div
        animate={{ filter: lit ? glowOn.iconFilter : glowOff.iconFilter, color: lit ? glowOn.color : glowOff.color }}
        transition={{ duration: 0.18 }}
      >
        <Icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
      </motion.div>
      <motion.span
        animate={{ textShadow: lit ? glowOn.textShadow : glowOff.textShadow, color: lit ? glowOn.color : glowOff.color }}
        transition={{ duration: 0.18 }}
        className="text-[10px] font-medium leading-none relative"
      >
        {label}
      </motion.span>
    </motion.button>
  );
}

/** Inner sidebar content — shared between desktop fixed and mobile drawer */
function SidebarContent({
  activeView,
  onViewChange,
  onToggleNotifications,
  onToggleProfile,
  showProfile,
  onClose,
}: SidebarProps & { onClose?: () => void }) {
  const [notifHovered, setNotifHovered] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);

  const handleNav = (view: ActiveView) => {
    onViewChange(view);
    onClose?.();
  };

  return (
    <div className="w-full h-full bg-[#030509] flex flex-col items-center py-5 relative">
      {/* Close button — mobile only */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#F8FAFC] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Logo */}
      <div className="w-10 h-10 flex items-center justify-center mb-5 relative shrink-0">
        <div className="absolute inset-0 bg-[#3B5EFF] blur-[16px] opacity-30 rounded-full" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Marg AI"
          className="w-10 h-10 rounded-full object-cover relative z-10 border border-white/10"
          style={{ boxShadow: "0 0 14px rgba(59,94,255,0.5)" }}
        />
      </div>

      {/* Main Nav */}
      <nav className="flex flex-col gap-5 flex-1 w-full items-center" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavButton
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.label}
            onClick={() => handleNav(item.label)}
          />
        ))}

        {/* Notifications */}
        <motion.button
          onClick={() => { onToggleNotifications(); onClose?.(); }}
          onHoverStart={() => setNotifHovered(true)}
          onHoverEnd={() => setNotifHovered(false)}
          whileTap={{ scale: 0.92 }}
          animate={{ scale: notifHovered ? 1.05 : 1 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col items-center justify-center gap-1.5 relative w-full py-1"
          aria-label="Notifications"
        >
          <motion.span
            animate={{ backgroundColor: notifHovered ? glowOn.bg : glowOff.bg }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-2 inset-y-0 rounded-xl pointer-events-none"
          />
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ filter: notifHovered ? glowOn.iconFilter : glowOff.iconFilter, color: notifHovered ? glowOn.color : glowOff.color }}
              transition={{ duration: 0.18 }}
            >
              <Bell className="w-[22px] h-[22px]" strokeWidth={1.5} />
            </motion.div>
            <div className="absolute -right-1 -top-1 w-[6px] h-[6px] bg-[#00D9FF] rounded-full shadow-[0_0_8px_rgba(0,217,255,1)]" />
          </div>
          <motion.span
            animate={{ textShadow: notifHovered ? glowOn.textShadow : glowOff.textShadow, color: notifHovered ? glowOn.color : glowOff.color }}
            transition={{ duration: 0.18 }}
            className="text-[10px] font-medium leading-none relative"
          >
            Notifications
          </motion.span>
        </motion.button>

        {/* Settings */}
        <NavButton
          icon={Settings}
          label="Settings"
          isActive={activeView === "Settings"}
          onClick={() => handleNav("Settings")}
        />
      </nav>

      {/* User Avatar */}
      <motion.button
        onClick={() => { onToggleProfile(); onClose?.(); }}
        onHoverStart={() => setAvatarHovered(true)}
        onHoverEnd={() => setAvatarHovered(false)}
        whileTap={{ scale: 0.92 }}
        animate={{
          scale: avatarHovered || showProfile ? 1.08 : 1,
          boxShadow: avatarHovered || showProfile ? "0 0 16px rgba(0,217,255,0.6), 0 0 32px rgba(0,217,255,0.25)" : "0 0 15px rgba(0,217,255,0.15)",
          borderColor: avatarHovered || showProfile ? "rgba(0,217,255,0.9)" : "rgba(0,217,255,0.4)",
          backgroundColor: avatarHovered || showProfile ? "rgba(0,217,255,0.12)" : "rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.18 }}
        className="mt-2 w-[42px] h-[42px] rounded-full border flex items-center justify-center text-[14px] font-medium"
        aria-label="User profile"
      >
        <motion.span
          animate={{ color: avatarHovered || showProfile ? glowOn.color : "#00D9FF", textShadow: avatarHovered || showProfile ? glowOn.textShadow : glowOff.textShadow }}
          transition={{ duration: 0.18 }}
        >
          A
        </motion.span>
      </motion.button>
    </div>
  );
}

export default function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop sidebar (md+) ── */}
      <aside className="hidden md:flex w-[88px] h-full bg-[#030509] flex-col items-center shrink-0 z-10 relative border-r border-white/5">
        <SidebarContent {...props} />
      </aside>

      {/* ── Mobile: hamburger trigger ── */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setMobileOpen(true)}
          whileTap={{ scale: 0.92 }}
          className="w-11 h-11 rounded-full glass-card flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] transition-colors border border-white/10"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[88px] border-r border-white/5"
            >
              <SidebarContent {...props} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
