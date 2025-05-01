
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Shield as ShieldIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OAuthButtonProps {
  provider: "google" | "facebook" | "anonymous";
  onClick: () => Promise<any>;
  className?: string;
}

export function OAuthButton({ provider, onClick, className }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await onClick();
    } catch (error) {
      console.error(`Error with ${provider} sign in:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Provider-specific configurations
  const getConfig = () => {
    switch (provider) {
      case "google":
        return {
          label: "Continuar com Google",
          icon: (props: any) => (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={cn("h-5 w-5", props.className)} 
              viewBox="0 0 48 48"
            >
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
          ),
          hoverColor: "hover:bg-yellow-500/10",
          focusColor: "focus:ring-yellow-500/40",
        };
      case "facebook":
        return {
          label: "Continuar com Facebook",
          icon: ShieldIcon,
          iconColor: "text-blue-600",
          hoverColor: "hover:bg-blue-500/10",
          focusColor: "focus:ring-blue-500/40",
        };
      case "anonymous":
        return {
          label: "Jogar sem Conta",
          icon: Shield,
          iconColor: "text-emerald-400",
          hoverColor: "hover:bg-emerald-500/10",
          focusColor: "focus:ring-emerald-500/40",
        };
      default:
        return {
          label: "Continuar",
          icon: ShieldIcon,
          hoverColor: "hover:bg-primary/10",
          focusColor: "focus:ring-primary/40",
        };
    }
  };

  const config = getConfig();

  const IconComponent = config.icon;

  // Animation variants
  const buttonVariants = {
    hover: {
      scale: 1.03,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const flameVariants = {
    initial: { opacity: 0, scale: 0.8 },
    hover: { 
      opacity: 1, 
      scale: 1.2,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants}
      className="relative"
    >
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "w-full relative py-6 overflow-hidden",
          "border-fantasy-purple/30 bg-fantasy-dark/80",
          "text-fantasy-gold font-medievalsharp",
          config.hoverColor,
          "focus:ring-2 focus:ring-offset-2",
          config.focusColor,
          "transition-all duration-300",
          className
        )}
      >
        <span className="flex items-center gap-2">
          <IconComponent className={cn("h-5 w-5", config.iconColor)} />
          {isLoading ? "Carregando..." : config.label}
        </span>
      </Button>
      
      {/* Torch flame effect on hover */}
      <motion.div
        variants={flameVariants}
        className="absolute -top-1 -right-1 w-8 h-8 pointer-events-none"
      >
        <div className="w-full h-full bg-gradient-to-t from-yellow-500 via-orange-500 to-red-500 rounded-full blur-sm opacity-70" />
        <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full blur-sm opacity-50" />
      </motion.div>
    </motion.div>
  );
}
