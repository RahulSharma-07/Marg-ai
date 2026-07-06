"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Poppins, Orbitron, Audiowide } from "next/font/google";

// ── Auth-page-only fonts ───────────────────────────────────────────────────────
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});
const audiowide = Audiowide({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.333 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.000 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.316 0-9.828-3.317-11.508-7.969H5.750v5.586C9.068 39.713 16.044 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C42.012 35.736 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

const inputBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};
const focusStyle = { border: "1px solid rgba(0,217,255,0.4)", boxShadow: "0 0 0 3px rgba(0,217,255,0.08)" };
const blurStyle = { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" };

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Google OAuth
  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Email + Password sign up
  const handleSignUp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message || "Something went wrong. Please try again.");
      setIsLoading(false);
      return;
    }

    // If user is immediately active (email confirmation disabled) → redirect to home
    if (data?.user?.confirmed_at || data?.user?.email_confirmed_at) {
      router.push("/");
      router.refresh();
      return;
    }

    // If session exists, user is logged in immediately
    if (data?.session) {
      router.push("/");
      router.refresh();
      return;
    }

    // Otherwise email confirmation is required
    setSuccess("Account created! Check your email to confirm your account, then sign in.");
    setIsLoading(false);
    setTimeout(() => router.push("/login"), 4000);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#050608] p-4 sm:p-6"
      style={{
        backgroundImage: `
          radial-gradient(circle at 80% 20%, rgba(0,217,255,0.12), transparent 55%),
          radial-gradient(circle at 20% 80%, rgba(0,217,255,0.06), transparent 50%)
        `,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[860px] rounded-[24px] overflow-hidden flex flex-col md:flex-row"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 80px rgba(0,217,255,0.06), 0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Left — Astronaut (hidden on mobile) */}
        <div
          className="relative hidden md:block md:w-[420px] shrink-0 overflow-hidden rounded-t-[24px] md:rounded-t-none md:rounded-l-[24px] min-h-[520px]"
          style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(0,40,50,0.9) 0%, rgba(2,4,8,1) 75%)" }}
        >
          <Image src="/Astronote.png" alt="Astronaut" fill className="object-cover object-top scale-110" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020408]/60 via-transparent to-transparent" />
        </div>

        {/* Right — Form */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 md:px-10 py-8 md:py-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="mb-7">
            <h1
              className={`${poppins.className} text-[24px] sm:text-[28px] text-[#FFFFFF] leading-tight`}
              style={{ fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              Join
            </h1>
            <h1
              className={`${orbitron.className} text-[32px] sm:text-[38px] leading-tight`}
              style={{ fontWeight: 700, letterSpacing: "-0.02em", color: "#00D9FF", textShadow: "0 0 30px rgba(0,217,255,0.5)" }}
            >
              Marg AI
            </h1>
          </motion.div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            {/* Google */}
            <motion.button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`${poppins.className} w-full h-[52px] rounded-full flex items-center justify-center gap-3 text-[15px] text-[#F8FAFC] transition-all duration-200 disabled:opacity-60`}
              style={{ fontWeight: 500, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <GoogleIcon />
              Sign Up With Google
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-0.5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[#64748B] text-xs font-medium tracking-wider">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Name */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"><User className="w-4 h-4" /></div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required
                className={`${poppins.className} w-full h-[52px] rounded-full pl-11 pr-5 text-[15px] text-[#F8FAFC] outline-none transition-all duration-200`}
                style={{ ...inputBase, fontWeight: 500 }}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => Object.assign(e.target.style, blurStyle)}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"><Mail className="w-4 h-4" /></div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
                className={`${poppins.className} w-full h-[52px] rounded-full pl-11 pr-5 text-[15px] text-[#F8FAFC] outline-none transition-all duration-200`}
                style={{ ...inputBase, fontWeight: 500 }}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => Object.assign(e.target.style, blurStyle)}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"><Lock className="w-4 h-4" /></div>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
                className={`${poppins.className} w-full h-[52px] rounded-full pl-11 pr-12 text-[15px] text-[#F8FAFC] outline-none transition-all duration-200`}
                style={{ ...inputBase, fontWeight: 500 }}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => Object.assign(e.target.style, blurStyle)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"><Lock className="w-4 h-4" /></div>
              <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required
                className={`${poppins.className} w-full h-[52px] rounded-full pl-11 pr-12 text-[15px] text-[#F8FAFC] outline-none transition-all duration-200`}
                style={{ ...inputBase, fontWeight: 500 }}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => Object.assign(e.target.style, blurStyle)}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error / Success */}
            {error && error.length > 0 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#EF4444] text-[13px] text-center -mt-1">{error}</motion.p>}
            {success && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#22C55E] text-[13px] text-center -mt-1">{success}</motion.p>}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`${audiowide.className} w-full h-[52px] rounded-full text-white mt-1 transition-all duration-200 disabled:opacity-60`}
              style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.02em", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 0 20px rgba(0,0,0,0.4)" }}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </motion.button>
          </form>

          <p className="text-center text-[13px] text-[#64748B] mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-[#00D9FF] hover:underline font-medium">Sign in</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
