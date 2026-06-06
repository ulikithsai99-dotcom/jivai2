import { motion, AnimatePresence } from "framer-motion";

interface TranscriptPanelProps {
  text: string;
  isListening: boolean;
}

export function TranscriptPanel({ text, isListening }: TranscriptPanelProps) {
  return (
    <div className="w-full max-w-2xl px-6 min-h-[120px] flex items-end justify-center pb-8">
      <AnimatePresence>
        {(text || isListening) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-2xl md:text-3xl font-medium tracking-tight leading-relaxed text-foreground">
              {text || <span className="text-muted-foreground italic">Listening...</span>}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
