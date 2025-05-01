
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { COLORS } from "@/constants/Colors";

interface MedievalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function MedievalButton({ 
  children, 
  onClick, 
  className = "",
  variant = "primary",
  disabled = false,
  type = "button",
  icon
}: MedievalButtonProps) {
  // Função para tocar o efeito sonoro quando disponível
  const playClickSound = () => {
    const audio = new Audio("/assets/sounds/button-click.mp3");
    audio.volume = 0.5;
    audio.play().catch(err => console.warn("Áudio não pôde ser reproduzido:", err));
  };
  
  const handleClick = () => {
    playClickSound();
    onClick && onClick();
  };
  
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return `bg-gradient-to-br from-[${COLORS.DUNGEON_PURPLE}] to-[${COLORS.MAGIC_ACCENT}] 
                text-white hover:from-[${COLORS.MAGIC_ACCENT}] hover:to-[${COLORS.DUNGEON_PURPLE}]`;
      case "secondary":
        return `bg-gradient-to-br from-[${COLORS.MAGIC_ACCENT}]/80 to-[${COLORS.MAGIC_ACCENT}] 
                hover:from-[${COLORS.MAGIC_ACCENT}] hover:to-[${COLORS.MAGIC_ACCENT}]/80 text-[${COLORS.DUNGEON_PURPLE}]`;
      case "outline":
        return `border border-[${COLORS.MAGIC_ACCENT}] text-[${COLORS.MAGIC_ACCENT}] 
                bg-transparent hover:bg-[${COLORS.MAGIC_ACCENT}]/10`;
      default:
        return "";
    }
  };
  
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      <Button
        className={`font-medievalsharp relative overflow-hidden py-2 px-4 rounded-md 
                   transition-all flex items-center gap-2 ${getVariantClasses()} ${className}`}
        onClick={handleClick}
        disabled={disabled}
        type={type}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Button>
    </motion.div>
  );
}
