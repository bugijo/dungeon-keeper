
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Backpack, Scroll, Award, Sword } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/constants/Colors";

const navItems = [
  { path: "/", icon: MapPin, label: "Missões", testId: "quests-tab" },
  { path: "/inventory", icon: Backpack, label: "Inventário", testId: "inventory-tab" },
  { path: "/skills", icon: Scroll, label: "Magias", testId: "skills-tab" },
  { path: "/achievements", icon: Award, label: "Conquistas", testId: "achievements-tab" },
  { path: "/tables", icon: Sword, label: "Mesas", testId: "tables-tab" },
];

export function FooterTabs() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[${COLORS.DUNGEON_PURPLE}] border-t border-[${COLORS.MAGIC_ACCENT}]/20 py-1 px-2 z-50"
         style={{ boxShadow: `0 -2px 10px rgba(0,0,0,0.2)` }}>
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={item.testId}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive ? `text-[${COLORS.MAGIC_ACCENT}]` : "text-fantasy-stone/70 hover:text-fantasy-stone"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={isActive ? { 
                  y: [0, -5, 0],
                  transition: { 
                    duration: 0.4,
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                  }
                } : {}}
              >
                <Icon className={cn(
                  "w-6 h-6",
                  isActive && `fill-[${COLORS.MAGIC_ACCENT}]/10`
                )} />
              </motion.div>
              <span className="text-xs mt-1 font-medievalsharp">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 h-1 w-1/2 rounded-full bg-[${COLORS.MAGIC_ACCENT}]`}
                  transition={{ duration: 0.3 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
