import { motion } from "framer-motion";
import { Phone, MapPin, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  show: boolean;
  onToggleGuide: () => void;
}

export function ActionButtons({ show, onToggleGuide }: ActionButtonsProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-2xl px-6 py-8 flex flex-col sm:flex-row gap-4 items-center justify-center"
    >
      <Button 
        size="lg" 
        variant="destructive" 
        className="w-full sm:w-auto h-14 text-lg font-bold shadow-[0_0_20px_hsl(var(--destructive)/0.3)] hover:shadow-[0_0_30px_hsl(var(--destructive)/0.5)]"
        onClick={() => window.location.href = "tel:911"}
      >
        <Phone className="mr-2 w-6 h-6" />
        Call 911
      </Button>

      <Button 
        size="lg" 
        variant="secondary" 
        className="w-full sm:w-auto h-14 text-lg bg-secondary/50 hover:bg-secondary border border-border"
        onClick={() => window.open("https://www.google.com/maps/search/hospital+OR+police+station", "_blank")}
      >
        <MapPin className="mr-2 w-6 h-6" />
        Nearby Help
      </Button>

      <Button 
        size="lg" 
        variant="outline" 
        className="w-full sm:w-auto h-14 text-lg bg-transparent border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        onClick={onToggleGuide}
      >
        <ListChecks className="mr-2 w-6 h-6" />
        Steps
      </Button>
    </motion.div>
  );
}
