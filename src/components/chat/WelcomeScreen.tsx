"use client";

import { motion } from "framer-motion";

interface WelcomeScreenProps {
  userName: string;
}

export default function WelcomeScreen({ userName }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center mb-12 text-center"
    >
      <h1 className="hero-text text-[#F8FAFC] tracking-tight mb-4">
        Hello What's up I am Marg AI <span className="inline-block animate-wave">👋</span>
      </h1>
      <p className="body-text text-[#94A3B8]">
        How can I help you today?
      </p>
    </motion.div>
  );
}
