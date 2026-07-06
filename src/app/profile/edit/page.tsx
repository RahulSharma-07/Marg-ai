"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Save, CheckCircle } from "lucide-react";

const inputBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};
const focusStyle = { border: "1px solid rgba(0,217,255,0.4)", boxShadow: "0 0 0 3px rgba(0,217,255,0.08)" };
const blurStyle  = { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" };

interface UserProfile {
  name: string;
  email: string;
  goal: string | null;
}

function InputField({
  label, value, onChange, type = "text", icon, placeholder, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#94A3B8]">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-[52px] rounded-[14px] pl-11 pr-5 text-[14px] font-medium text-[#F8FAFC] placeholder:text-[#64748B] outline-none transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={inputBase}
          onFocus={(e) => !disabled && Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => Object.assign(e.target.style, blurStyle)}
        />
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "", goal: "" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load current user data
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Set from auth metadata first (always available)
      setProfile({
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
        email: user.email ?? "",
        goal: "",
      });

      // Try users table — may not exist yet if migration hasn't been run
      try {
        const { data } = await supabase.from("users").select("name, email, goal").eq("id", user.id).single();
        if (data) {
          setProfile({
            name: data.name ?? user.user_metadata?.full_name ?? "",
            email: data.email ?? user.email ?? "",
            goal: data.goal ?? "",
          });
        }
      } catch {
        // Table doesn't exist yet — use auth metadata only, that's fine
      }
      setIsLoading(false);
    };
    loadUser();
  }, [supabase, router]);

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Update auth metadata (name)
      const authUpdates: { data?: Record<string, string>; password?: string } = {
        data: { full_name: profile.name },
      };
      if (newPassword) authUpdates.password = newPassword;

      const { error: authErr } = await supabase.auth.updateUser(authUpdates);
      if (authErr) throw new Error(authErr.message);

      // Update users table (best effort — may not exist yet)
      try {
        await supabase
          .from("users")
          .update({ name: profile.name, goal: profile.goal })
          .eq("id", user.id);
      } catch {
        // Table doesn't exist yet — auth metadata was still updated above
      }

      setSuccess("Profile updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050608]">
        <div className="w-8 h-8 border-2 border-[#00D9FF]/30 border-t-[#00D9FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#050608] p-4"
      style={{
        backgroundImage: `
          radial-gradient(circle at 75% 20%, rgba(0,217,255,0.10), transparent 55%),
          radial-gradient(circle at 25% 80%, rgba(0,217,255,0.05), transparent 50%)
        `,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[560px]"
      >
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#F8FAFC] transition-colors mb-6 text-[14px] group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Card */}
        <div
          className="rounded-[24px] p-5 sm:p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 60px rgba(0,217,255,0.05), 0 24px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-bold text-[#00D9FF] shrink-0"
              style={{
                background: "rgba(0,217,255,0.08)",
                border: "2px solid rgba(0,217,255,0.3)",
                boxShadow: "0 0 20px rgba(0,217,255,0.15)",
              }}
            >
              {profile.name ? profile.name[0].toUpperCase() : "?"}
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-[#F8FAFC]">Edit Profile</h1>
              <p className="text-[13px] text-[#64748B]">{profile.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Section: Account Info */}
            <div>
              <p className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider mb-3">Account Info</p>
              <div className="flex flex-col gap-3">
                <InputField
                  label="Full Name"
                  value={profile.name}
                  onChange={(v) => setProfile(p => ({ ...p, name: v }))}
                  icon={<User className="w-4 h-4" />}
                  placeholder="Your full name"
                />
                <InputField
                  label="Email"
                  value={profile.email}
                  onChange={() => {}}
                  type="email"
                  icon={<Mail className="w-4 h-4" />}
                  disabled
                />
                <InputField
                  label="Learning Goal"
                  value={profile.goal ?? ""}
                  onChange={(v) => setProfile(p => ({ ...p, goal: v }))}
                  icon={<span className="text-[14px]">🎯</span>}
                  placeholder="e.g. Become a Web Developer"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Section: Change Password */}
            <div>
              <p className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider mb-3">Change Password</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#94A3B8]">New Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full h-[52px] rounded-[14px] pl-11 pr-12 text-[14px] font-medium text-[#F8FAFC] placeholder:text-[#64748B] outline-none transition-all duration-200"
                      style={inputBase}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#94A3B8]">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full h-[52px] rounded-[14px] pl-11 pr-12 text-[14px] font-medium text-[#F8FAFC] placeholder:text-[#64748B] outline-none transition-all duration-200"
                      style={inputBase}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#EF4444] text-[13px] text-center">
                {error}
              </motion.p>
            )}
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-[#22C55E] text-[13px]">
                <CheckCircle className="w-4 h-4" />
                {success}
              </motion.div>
            )}

            {/* Save Button */}
            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full h-[52px] rounded-full text-[15px] font-bold text-[#00D9FF] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 mt-1"
              style={{
                background: "rgba(0,217,255,0.08)",
                border: "1px solid rgba(0,217,255,0.3)",
                boxShadow: "0 0 20px rgba(0,217,255,0.1)",
              }}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
