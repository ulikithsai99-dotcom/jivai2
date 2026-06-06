import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface ResponsePanelProps {
  text: string;
  isThinking: boolean;
}

export function ResponsePanel({ text, isThinking }: ResponsePanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text]);

  return (
    <div className="w-full max-w-2xl flex flex-col justify-end flex-grow px-6 pb-4 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      
      <div className="overflow-y-auto no-scrollbar pt-16 flex flex-col justify-end min-h-full max-h-[40vh]">
        <AnimatePresence>
          {isThinking && !text && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 text-center"
            >
              <span className="text-lg text-primary/70 animate-pulse uppercase tracking-widest font-semibold text-sm">Analyzing situation...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-4 space-y-4"
          >
            {text.split('\n').map((paragraph, i) => (
              <p key={i} className="text-xl md:text-2xl font-serif leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
            <div ref={endRef} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
