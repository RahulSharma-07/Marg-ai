"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  Trash2,
  LogOut,
  Bell,
  Moon,
  Sun,
  MessageSquare,
  Shield,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

// ─── Shared style constants ───────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};
const focusStyle = {
  border: "1px solid rgba(0,217,255,0.4)",
  boxShadow: "0 0 0 3px rgba(0,217,255,0.08)",
};
const blurStyle = { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" };

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[20px] p-5 sm:p-7 flex flex-col gap-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <p className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      role="switch"
      aria-checked={enabled}
      className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none"
      style={{
        background: enabled
          ? "rgba(0,217,255,0.85)"
          : "rgba(255,255,255,0.14)",
        boxShadow: enabled
          ? "0 0 10px rgba(0,217,255,0.35)"
          : "none",
      }}
    >
      {/* Knob */}
      <span
        className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          transform: enabled ? "translateX(20px)" : "translateX(0px)",
        }}
      />
    </button>
  );
}

// ─── Setting row ──────────────────────────────────────────────────────────────

function SettingRow({
  icon,
  label,
  description,
  children,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  children?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: danger
              ? "rgba(239,68,68,0.12)"
              : "rgba(0,217,255,0.08)",
            color: danger ? "#EF4444" : "#00D9FF",
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className="text-[13px] sm:text-[14px] font-medium truncate"
            style={{ color: danger ? "#EF4444" : "#F8FAFC" }}
          >
            {label}
          </p>
          {description && (
            <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  type = "text",
  icon,
  placeholder,
  disabled,
  rightSlot,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[#64748B]">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-[48px] rounded-[14px] pl-11 pr-5 text-[14px] font-medium text-[#F8FAFC] placeholder:text-[#475569] outline-none transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={inputBase}
          onFocus={(e) => !disabled && Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => Object.assign(e.target.style, blurStyle)}
        />
        {rightSlot && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main SettingsView ────────────────────────────────────────────────────────

interface SettingsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function SettingsView({ isDark, onToggleTheme }: SettingsViewProps) {
  const supabase = createClient();

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password state
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Notification prefs
  const [notifSessions, setNotifSessions] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(true);

  // Danger zone
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [deletingHistory, setDeletingHistory] = useState(false);

  // Load user on mount
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setName(
        user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          ""
      );
      setEmail(user.email ?? "");

      try {
        const { data } = await supabase
          .from("users")
          .select("name, goal")
          .eq("id", user.id)
          .single();
        if (data) {
          if (data.name) setName(data.name);
          if (data.goal) setGoal(data.goal);
        }
      } catch {
        // users table may not have goal yet — fine
      }
      setProfileLoading(false);
    };
    load();
  }, [supabase]);

  // Save profile
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const {
        data: { user },
        error: getErr,
      } = await supabase.auth.getUser();
      if (getErr || !user) throw new Error("Not authenticated");

      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (error) throw error;

      // Best-effort update to users table
      try {
        await supabase
          .from("users")
          .update({ name, goal })
          .eq("id", user.id);
      } catch {
        /* table may not exist yet */
      }

      setProfileMsg({ type: "ok", text: "Profile saved successfully!" });
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err) {
      setProfileMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to save profile",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!newPwd) return;
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "err", text: "Passwords do not match" });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: "err", text: "Password must be at least 6 characters" });
      return;
    }
    setPwdSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setNewPwd("");
      setConfirmPwd("");
      setPwdMsg({ type: "ok", text: "Password updated successfully!" });
      setTimeout(() => setPwdMsg(null), 3000);
    } catch (err) {
      setPwdMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to update password",
      });
    } finally {
      setPwdSaving(false);
    }
  };

  // Clear chat history
  const handleClearHistory = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeletingHistory(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // Delete all sessions belonging to this user (messages cascade)
      await supabase
        .from("chat_sessions")
        .delete()
        .eq("user_id", user.id);
      setDeleteHistory(true);
      setConfirmDelete(false);
    } catch {
      // ignore
    } finally {
      setDeletingHistory(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const avatar = name ? name[0].toUpperCase() : email ? email[0].toUpperCase() : "?";

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-8 py-6 sm:py-8"
    >
      <div className="w-full max-w-[720px] mx-auto flex flex-col gap-6">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#00D9FF] font-bold text-[15px] shrink-0"
            style={{
              background: "rgba(0,217,255,0.1)",
              border: "1.5px solid rgba(0,217,255,0.3)",
              boxShadow: "0 0 16px rgba(0,217,255,0.1)",
            }}
          >
            {profileLoading ? "…" : avatar}
          </div>
          <div>
            <h1 className="text-[20px] sm:text-[24px] font-bold text-[#F8FAFC] leading-tight">
              Settings
            </h1>
            <p className="text-[12px] text-[#64748B]">{email || "Loading…"}</p>
          </div>
        </div>

        {/* ── Profile ────────────────────────────────────────────── */}
        <Section title="Profile">
          <div className="flex flex-col gap-4">
            <InputField
              label="Full Name"
              value={name}
              onChange={setName}
              icon={<User className="w-4 h-4" />}
              placeholder="Your full name"
            />
            <InputField
              label="Email"
              value={email}
              onChange={() => {}}
              type="email"
              icon={<Mail className="w-4 h-4" />}
              disabled
            />
            <InputField
              label="Learning Goal"
              value={goal}
              onChange={setGoal}
              icon={<span className="text-[14px]">🎯</span>}
              placeholder="e.g. Become a Full-Stack Developer"
            />
          </div>

          <AnimatePresence>
            {profileMsg && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[13px]"
                style={{
                  color: profileMsg.type === "ok" ? "#22C55E" : "#EF4444",
                }}
              >
                {profileMsg.type === "ok" ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {profileMsg.text}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={handleSaveProfile}
            disabled={profileSaving || profileLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="h-[48px] px-6 rounded-full text-[14px] font-semibold text-[#00D9FF] flex items-center gap-2 self-start transition-all duration-200 disabled:opacity-50"
            style={{
              background: "rgba(0,217,255,0.08)",
              border: "1px solid rgba(0,217,255,0.3)",
            }}
          >
            <Save className="w-4 h-4" />
            {profileSaving ? "Saving…" : "Save Profile"}
          </motion.button>
        </Section>

        {/* ── Security ───────────────────────────────────────────── */}
        <Section title="Security">
          <div className="flex flex-col gap-4">
            <InputField
              label="New Password"
              value={newPwd}
              onChange={setNewPwd}
              type={showNewPwd ? "text" : "password"}
              icon={<Lock className="w-4 h-4" />}
              placeholder="Leave blank to keep current"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowNewPwd((p) => !p)}
                  className="text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                >
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <InputField
              label="Confirm New Password"
              value={confirmPwd}
              onChange={setConfirmPwd}
              type={showConfirmPwd ? "text" : "password"}
              icon={<Lock className="w-4 h-4" />}
              placeholder="Confirm new password"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((p) => !p)}
                  className="text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                >
                  {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          <AnimatePresence>
            {pwdMsg && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[13px]"
                style={{ color: pwdMsg.type === "ok" ? "#22C55E" : "#EF4444" }}
              >
                {pwdMsg.type === "ok" ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {pwdMsg.text}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={handleChangePassword}
            disabled={pwdSaving || !newPwd}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="h-[48px] px-6 rounded-full text-[14px] font-semibold text-[#00D9FF] flex items-center gap-2 self-start transition-all duration-200 disabled:opacity-40"
            style={{
              background: "rgba(0,217,255,0.08)",
              border: "1px solid rgba(0,217,255,0.3)",
            }}
          >
            <Shield className="w-4 h-4" />
            {pwdSaving ? "Updating…" : "Update Password"}
          </motion.button>
        </Section>

        {/* ── Appearance ─────────────────────────────────────────── */}
        <Section title="Appearance">
          <SettingRow
            icon={isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            label="Dark Mode"
            description="Switch between dark and light themes"
          >
            <Toggle enabled={isDark} onChange={onToggleTheme} />
          </SettingRow>
        </Section>

        {/* ── Notifications ──────────────────────────────────────── */}
        <Section title="Notifications">
          <SettingRow
            icon={<Bell className="w-4 h-4" />}
            label="Session Saved"
            description="Notify when a chat session is automatically saved"
          >
            <Toggle enabled={notifSessions} onChange={setNotifSessions} />
          </SettingRow>
          <div
            className="h-px"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <SettingRow
            icon={<Bell className="w-4 h-4" />}
            label="Model Updates"
            description="Notify when a new AI model or feature is available"
          >
            <Toggle enabled={notifUpdates} onChange={setNotifUpdates} />
          </SettingRow>
        </Section>

        {/* ── Chat ───────────────────────────────────────────────── */}
        <Section title="Chat">
          <SettingRow
            icon={<MessageSquare className="w-4 h-4" />}
            label="Chat History"
            description="Your conversations are saved automatically"
          >
            <span className="text-[11px] text-[#22C55E] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)" }}>
              Enabled
            </span>
          </SettingRow>
          <div
            className="h-px"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <SettingRow
            icon={<Trash2 className="w-4 h-4" />}
            label="Clear Chat History"
            description="Permanently delete all saved conversations"
            danger
          >
            <motion.button
              type="button"
              onClick={handleClearHistory}
              disabled={deletingHistory || deleteHistory}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-200 disabled:opacity-50"
              style={{
                color: confirmDelete ? "#050608" : "#EF4444",
                background: confirmDelete
                  ? "#EF4444"
                  : "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              {deleteHistory
                ? "Cleared ✓"
                : deletingHistory
                ? "Clearing…"
                : confirmDelete
                ? "Confirm?"
                : "Clear All"}
            </motion.button>
          </SettingRow>
          {confirmDelete && !deleteHistory && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-[#EF4444] -mt-2"
            >
              Click again to permanently delete all chat history. This cannot be undone.
            </motion.p>
          )}
        </Section>

        {/* ── Account ────────────────────────────────────────────── */}
        <Section title="Account">
          <SettingRow
            icon={<LogOut className="w-4 h-4" />}
            label="Sign Out"
            description="Sign out of your Marg AI account"
            danger
          >
            <motion.button
              type="button"
              onClick={handleSignOut}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-200"
              style={{
                color: "#EF4444",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              Sign Out
            </motion.button>
          </SettingRow>
        </Section>

        {/* Version footer */}
        <p className="text-center text-[11px] text-[#334155] pb-4">
          Marg AI · v1.0.0
        </p>
      </div>
    </motion.div>
  );
}
