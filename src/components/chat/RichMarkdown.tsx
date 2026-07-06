"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { motion } from "framer-motion";

// ─── Callout Detection ────────────────────────────────────────────────────────

type CalloutType = "note" | "warning" | "tip" | "danger";

interface CalloutConfig {
  border: string;
  bg: string;
  icon: string;
  label: string;
  textColor: string;
}

const CALLOUT_CONFIGS: Record<CalloutType, CalloutConfig> = {
  note: {
    border: "#00E5FF",
    bg: "rgba(0,180,255,0.08)",
    icon: "ℹ️",
    label: "Note",
    textColor: "#00E5FF",
  },
  warning: {
    border: "#FFB020",
    bg: "rgba(255,176,32,0.08)",
    icon: "⚠️",
    label: "Warning",
    textColor: "#FFB020",
  },
  tip: {
    border: "#16C784",
    bg: "rgba(22,199,132,0.08)",
    icon: "💡",
    label: "Tip",
    textColor: "#16C784",
  },
  danger: {
    border: "#FF5C5C",
    bg: "rgba(255,92,92,0.08)",
    icon: "🚨",
    label: "Danger",
    textColor: "#FF5C5C",
  },
};

function detectCallout(text: string): CalloutType | null {
  const lower = text.toLowerCase();
  if (lower.includes("**note:**") || lower.includes("**info:**")) return "note";
  if (lower.includes("**warning:**") || lower.includes("**caution:**")) return "warning";
  if (lower.includes("**tip:**") || lower.includes("**success:**")) return "tip";
  if (lower.includes("**important:**") || lower.includes("**danger:**")) return "danger";
  return null;
}

// ─── Callout Box ──────────────────────────────────────────────────────────────

function CalloutBox({ type, children }: { type: CalloutType; children: React.ReactNode }) {
  const config = CALLOUT_CONFIGS[type];
  return (
    <div
      className="my-3 px-4 py-3 rounded-xl"
      style={{
        background: config.bg,
        borderLeft: `4px solid ${config.border}`,
        borderTop: `1px solid ${config.border}22`,
        borderRight: `1px solid ${config.border}11`,
        borderBottom: `1px solid ${config.border}11`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span>{config.icon}</span>
        <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: config.textColor }}>
          {config.label}
        </span>
      </div>
      <div className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
        {children}
      </div>
    </div>
  );
}



function FlowDiagram({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 my-4 p-3 sm:p-4 rounded-xl" style={{ background: "rgba(0,229,255,0.03)", border: "1px solid rgba(0,229,255,0.1)" }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="px-2.5 sm:px-3 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium"
            style={{
              border: "1px solid rgba(0,229,255,0.3)",
              background: "rgba(0,229,255,0.05)",
              color: "#00E5FF",
              whiteSpace: "nowrap",
            }}
          >
            {step.trim()}
          </motion.div>
          {i < steps.length - 1 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 + 0.04 }}
              className="text-[13px] sm:text-[14px]"
              style={{ color: "rgba(0,229,255,0.5)" }}
            >
              →
            </motion.span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Example Card ─────────────────────────────────────────────────────────────

function ExampleCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-3 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-2 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,229,255,0.04)" }}
      >
        <div className="w-1 h-4 rounded-full" style={{ background: "#00E5FF" }} />
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#00E5FF" }}>
          Example
        </span>
      </div>
      <div className="px-5 py-4 text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-4 p-[1px] rounded-xl"
      style={{
        background: "linear-gradient(135deg, rgba(0,229,255,0.4), rgba(77,166,255,0.2), rgba(0,229,255,0.1))",
      }}
    >
      <div
        className="rounded-xl px-5 py-4"
        style={{ background: "rgba(10,18,28,0.95)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: "rgba(0,229,255,0.15)" }}
          >
            <span style={{ color: "#00E5FF", fontSize: "11px" }}>✦</span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#00E5FF" }}>
            Key Points
          </span>
        </div>
        <div className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────────────────────

function CodeBlock({ language, children }: { language?: string; children: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false);
  const codeText = typeof children === "string" ? children : String(children ?? "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="my-3 rounded-xl overflow-hidden w-full"
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(0,229,255,0.15)",
        maxWidth: "min(100%, calc(100vw - 32px))",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-2 flex-wrap gap-2"
        style={{ borderBottom: "1px solid rgba(0,229,255,0.08)", background: "rgba(0,0,0,0.2)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ background: "#FF5C5C" }} />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ background: "#FFB020" }} />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ background: "#16C784" }} />
          </div>
          {language && (
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest ml-1 sm:ml-2" style={{ color: "rgba(0,229,255,0.6)" }}>
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md transition-all duration-200 shrink-0"
          style={{
            color: copied ? "#16C784" : "rgba(255,255,255,0.4)",
            background: copied ? "rgba(22,199,132,0.1)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${copied ? "rgba(22,199,132,0.3)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      {/* Code — horizontally scrollable on mobile */}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch w-full">
        <pre className="px-3 sm:px-4 py-3 sm:py-4 text-[11px] sm:text-[13px] leading-relaxed" style={{ margin: 0, minWidth: "max-content" }}>
          <code className="font-mono" style={{ color: "rgba(255,255,255,0.88)" }}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}

// ─── Paragraph Processor ─────────────────────────────────────────────────────
// Detects special patterns and routes to dedicated components

function SmartParagraph({ children }: { children: React.ReactNode }) {
  const text = React.Children.toArray(children)
    .map((c) => (typeof c === "string" ? c : ""))
    .join("");

  // Example card detection
  const isExample =
    text.startsWith("**Example:**") ||
    text.startsWith("📌 Example") ||
    text.startsWith("Example:");

  // Summary card detection
  const isSummary =
    text.includes("**In Short:**") ||
    text.includes("**Summary:**") ||
    text.includes("**Key Points:**");

  // Flow diagram: detect "A → B → C" or "Step 1 → Step 2"
  const flowMatch = text.match(/^(.+?(?:\s*→\s*.+?){1,})$/);
  if (flowMatch && text.includes("→")) {
    const steps = text.split("→");
    if (steps.length >= 2 && steps.every((s) => s.trim().length < 60)) {
      return <FlowDiagram steps={steps} />;
    }
  }

  if (isExample) {
    return <ExampleCard>{children}</ExampleCard>;
  }

  if (isSummary) {
    return <SummaryCard>{children}</SummaryCard>;
  }

  return (
    <p
      className="mb-3 last:mb-0"
      style={{ fontSize: "15px", lineHeight: "1.8", color: "rgba(255,255,255,0.85)" }}
    >
      {children}
    </p>
  );
}

// ─── Main RichMarkdown Component ──────────────────────────────────────────────

interface RichMarkdownProps {
  content: string;
  animate?: boolean;
}

export default function RichMarkdown({ content, animate = true }: RichMarkdownProps) {
  // Memoize components to avoid re-creation on each render
  const components = useMemo(() => ({
    // Headings
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1
        className="font-bold mt-6 mb-3 first:mt-0"
        style={{ fontSize: "22px", color: "#00E5FF", lineHeight: "1.3" }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2
        className="font-bold mt-5 mb-2.5 first:mt-0"
        style={{ fontSize: "19px", color: "#00E5FF", lineHeight: "1.3" }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3
        className="font-semibold mt-4 mb-2 first:mt-0"
        style={{ fontSize: "16px", color: "#4DA6FF", lineHeight: "1.4" }}
      >
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4
        className="font-semibold mt-3 mb-1.5 first:mt-0"
        style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}
      >
        {children}
      </h4>
    ),

    // Paragraph — smart routing
    p: ({ children }: { children?: React.ReactNode }) => (
      <SmartParagraph>{children}</SmartParagraph>
    ),

    // Bullet list
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-none mb-3 space-y-1.5 pl-1">{children}</ul>
    ),

    // Numbered list
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-none mb-3 space-y-1.5 pl-1 counter-reset-item">{children}</ol>
    ),

    // List item — use bullet for both ol and ul, styled with accent color
    li: ({ children }: { children?: React.ReactNode }) => {
      return (
        <li className="flex gap-2.5 items-start text-[15px]" style={{ color: "rgba(255,255,255,0.85)" }}>
          <span
            className="shrink-0 mt-0.5 font-semibold text-[13px]"
            style={{ color: "#00E5FF", minWidth: "16px" }}
          >
            •
          </span>
          <span className="leading-relaxed">{children}</span>
        </li>
      );
    },

    // Strong / Bold
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold" style={{ color: "#F8FAFC" }}>
        {children}
      </strong>
    ),

    // Italic
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic" style={{ color: "rgba(255,255,255,0.75)" }}>
        {children}
      </em>
    ),

    // Inline code
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
      const isBlock = className?.includes("language-");
      const lang = className?.replace("language-", "") ?? undefined;

      if (isBlock) {
        return <CodeBlock language={lang}>{children}</CodeBlock>;
      }

      return (
        <code
          className="rounded px-1.5 py-0.5 text-[13px] font-mono"
          style={{
            background: "rgba(0,229,255,0.1)",
            color: "#00E5FF",
            border: "1px solid rgba(0,229,255,0.15)",
          }}
        >
          {children}
        </code>
      );
    },

    // Pre block — handled by code above, but keep pre clean
    pre: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-1">{children}</div>
    ),

    // Blockquote — smart: detect callout type or fall back to styled quote
    blockquote: ({ children }: { children?: React.ReactNode }) => {
      const text = React.Children.toArray(children)
        .map((c) => {
          if (typeof c === "string") return c;
          if (React.isValidElement(c)) {
            const childText = React.Children.toArray((c.props as { children?: React.ReactNode }).children ?? [])
              .map((gc) => (typeof gc === "string" ? gc : ""))
              .join("");
            return childText;
          }
          return "";
        })
        .join("");

      const calloutType = detectCallout(text);

      if (calloutType) {
        // Strip the **Label:** prefix from the content
        const cleanChildren = React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          const childEl = child as React.ReactElement<{ children?: React.ReactNode }>;
          return React.cloneElement(childEl, {
            children: React.Children.map(childEl.props.children, (subChild) => {
              if (typeof subChild === "string") {
                return subChild.replace(/\*\*(Note|Warning|Tip|Success|Important|Danger|Info|Caution):\*\*/gi, "").trim();
              }
              return subChild;
            }),
          });
        });
        return <CalloutBox type={calloutType}>{cleanChildren}</CalloutBox>;
      }

      return (
        <blockquote
          className="my-3 pl-4 py-2 pr-3 rounded-r-lg italic text-[14px] leading-relaxed"
          style={{
            borderLeft: "4px solid #00E5FF",
            background: "rgba(0,180,255,0.06)",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          {children}
        </blockquote>
      );
    },

    // Horizontal rule
    hr: () => (
      <hr
        className="my-5"
        style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }}
      />
    ),

    // Link
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 transition-colors duration-150"
        style={{ color: "#00E5FF" }}
        onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#4DA6FF")}
        onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#00E5FF")}
      >
        {children}
      </a>
    ),

    // Table
    table: ({ children }: { children?: React.ReactNode }) => (
      <div
        className="my-4 rounded-xl overflow-hidden"
        style={{
          maxWidth: "min(100%, calc(100vw - 32px))",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <table
          className="rich-table min-w-full text-[11px] sm:text-[13px]"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead>{children}</thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="rich-table">{children}</th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="rich-table">{children}</td>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr className="rich-table transition-colors duration-150">{children}</tr>
    ),
  }), []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
  };

  if (!animate) {
    return (
      <div className="rich-markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <motion.div
      className="rich-markdown-body"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </motion.div>
  );
}
