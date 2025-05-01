
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "dagger" | "shield" | "standard";
}

export function Spinner({ 
  size = "md", 
  className,
  variant = "dagger" 
}: SpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  const innerSizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  // Dagger spinner
  if (variant === "dagger") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={cn("text-fantasy-gold", sizeClasses[size])}
          >
            <path d="M14.5 4l-.74-1.49A2 2 0 0 0 11.89 1H4.07a2 2 0 0 0-1.87 1.51L1.5 4H2c.92 0 1.66.74 1.66 1.66v.01C3.66 6.74 2.92 7.5 2 7.5h-.5l1.51 3.39c.33.74 1.2 1.06 1.95.72.26-.11.51-.29.7-.54L9 6.67V19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-1"></path>
          </svg>
        </motion.div>
        
        {/* Trail effect */}
        <motion.div
          className={cn(
            "absolute top-0 left-0 w-full h-full rounded-full",
            "bg-fantasy-gold/10 backdrop-blur-sm"
          )}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeOut",
            repeatDelay: 0.5 
          }}
        />
      </div>
    );
  }

  // Shield spinner
  if (variant === "shield") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <motion.div
          className="absolute inset-0"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: 360
          }}
          transition={{ 
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 3, repeat: Infinity, ease: "linear" }
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={cn("text-fantasy-purple", sizeClasses[size])}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
          </svg>
        </motion.div>
        
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          <div className={cn(
            "rounded-full bg-fantasy-gold/20", 
            innerSizeClasses[size]
          )}></div>
        </motion.div>
      </div>
    );
  }

  // Standard spinner
  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <motion.div 
        className="w-full h-full rounded-full border-4 border-fantasy-purple/20"
        style={{ borderTopColor: 'hsl(var(--primary))' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
