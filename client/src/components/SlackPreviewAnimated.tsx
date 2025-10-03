import { useState, useEffect } from "react";

type Props = {
  channel?: string;
  messages?: string[];
  typingMsPerChar?: number;
  deletingMsPerChar?: number;
  holdMs?: number;
};

export default function SlackPreviewAnimated({
  channel = "team-general",
  messages = DEFAULT_MESSAGES,
  typingMsPerChar = 32,
  deletingMsPerChar = 16,
  holdMs = 1400,
}: Props) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!prefersReduced) return;
    setDisplay(messages[0] ?? "");
    setPhase("holding");
  }, [prefersReduced, messages]);

  useEffect(() => {
    if (prefersReduced) return;
    const current = messages[idx % messages.length] ?? "";

    if (phase === "typing") {
      if (display.length < current.length) {
        const t = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), typingMsPerChar);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("holding"), holdMs);
      return () => clearTimeout(t);
    }

    if (phase === "holding") {
      const t = setTimeout(() => setPhase("deleting"), holdMs / 2);
      return () => clearTimeout(t);
    }

    if (display.length > 0) {
      const t = setTimeout(() => setDisplay(display.slice(0, -1)), deletingMsPerChar);
      return () => clearTimeout(t);
    }
    setIdx((i) => (i + 1) % messages.length);
    setPhase("typing");
  }, [phase, display, idx, messages, typingMsPerChar, deletingMsPerChar, holdMs, prefersReduced]);

  return (
    <div className="rounded-[20px] border border-black/5 bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(0,0,0,0.30)]">
      <div
        className="rounded-2xl px-4 py-3 text-[15px] leading-[22px]"
        style={{ backgroundColor: "#1A1D21", color: "#EDEFF1" }}
      >
        <div className="mb-3 flex items-center justify-between text-xs" style={{ color: "rgba(237,239,241,0.7)" }}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#2EB67D" }} />
            <span className="text-[13px]">#{channel}</span>
          </div>
          <span className="opacity-60">⋯</span>
        </div>

        <div className="font-mono text-[14px]" aria-live="polite">
          <span className="opacity-70">/teammato</span>{" "}
          <span className="font-semibold" style={{ color: "#EDEFF1" }}>
            {display}
            {!prefersReduced && (
              <span className="ml-[1px] inline-block h-[1.1em] w-[7px] align-[-2px] bg-[#EDEFF1] animate-[blink_1s_steps(2,start)_infinite]" />
            )}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: "#2EB67D" }} />
            <span className="opacity-90">Anonymity on · meets k-threshold</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: "#5E6D79" }} />
            <span className="opacity-80">Added to weekly digest</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
      `}</style>
    </div>
  );
}

const DEFAULT_MESSAGES = [
  "It's hard to ask for help when deadlines pile up…",
  "We're slipping because specs change mid-sprint.",
  "On-call is burning people out on weekends.",
  "We need clearer decision owners for launches.",
  "I don't feel safe raising risks in planning.",
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches);
    on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return reduced;
}
