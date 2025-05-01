
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { COLORS } from "@/constants/Colors";

interface DungeonCardProps {
  title: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DungeonCard({ title, children, className, onClick }: DungeonCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg border border-fantasy-purple/20 shadow-md 
                  hover:shadow-lg transition-all duration-300 hover:border-fantasy-purple/40 p-4
                  bg-gradient-to-br from-[${COLORS.DUNGEON_PURPLE}] to-[${COLORS.DUNGEON_PURPLE}]/90 ${className || ''}`}
      whileHover={{ 
        boxShadow: `0 0 15px 2px ${COLORS.MAGIC_ACCENT}30`,
        borderColor: `${COLORS.MAGIC_ACCENT}50`,
      }}
      onClick={onClick}
    >
      <h3 className="text-xl font-medievalsharp text-[${COLORS.MAGIC_ACCENT}] mb-2">{title}</h3>
      {children}
    </motion.div>
  );
}
