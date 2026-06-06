import { motion } from "framer-motion";
import { Mic, MicOff, Loader2 } from "lucide-react";

export type MicState = "idle" | "listening" | "thinking";

interface MicButtonProps {
  state: MicState;
  onClick: () => void;
  disabled?: boolean;
}

export function MicButton({ state, onClick, disabled }: MicButtonProps) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {state === "listening" && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.4 }}
          />
        </>
      )}

      <motion.button
        className="relative z-10 flex items-center justify-center w-36 h-36 rounded-full bg-background border-4 transition-colors disabled:opacity-50"
        style={{
          borderColor: state === "listening" ? "hsl(var(--primary))" : state === "thinking" ? "hsl(var(--muted-foreground))" : "hsl(var(--primary) / 0.5)",
          boxShadow: state === "listening" ? "0 0 40px hsl(var(--primary) / 0.3), inset 0 0 20px hsl(var(--primary) / 0.2)" : "none",
        }}
        whileHover={!disabled && state === "idle" ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={onClick}
        disabled={disabled}
        aria-label={state === "listening" ? "Stop listening" : "Start listening"}
      >
        {state === "thinking" ? (
          <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
        ) : state === "listening" ? (
          <Mic className="w-12 h-12 text-primary" />
        ) : (
          <MicOff className="w-12 h-12 text-primary/50" />
        )}
      </motion.button>
    </div>
  );
}
