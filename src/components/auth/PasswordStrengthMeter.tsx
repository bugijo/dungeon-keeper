
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  // Strength calculation
  const getStrength = (password: string): number => {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };
  
  const strength = getStrength(password);
  
  const getStrengthText = (strength: number): string => {
    if (password.length === 0) return "";
    if (strength === 0) return "Frágil como um pergaminho";
    if (strength === 1) return "Fraco como um escudeiro";
    if (strength === 2) return "Médio como um soldado";
    if (strength === 3) return "Forte como um cavaleiro";
    return "Poderoso como um dragão!";
  };
  
  const getStrengthColor = (strength: number): string => {
    if (password.length === 0) return "bg-gray-300";
    if (strength === 0) return "bg-red-500";
    if (strength === 1) return "bg-orange-500";
    if (strength === 2) return "bg-yellow-500";
    if (strength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  if (!password) return null;
  
  return (
    <div className="w-full space-y-1 mt-1">
      <div className="h-1.5 w-full bg-fantasy-dark rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            getStrengthColor(strength)
          )}
          style={{ width: `${(strength / 4) * 100}%` }}
        />
      </div>
      <p className={cn(
        "text-xs font-medievalsharp",
        strength === 0 ? "text-red-400" :
        strength === 1 ? "text-orange-400" :
        strength === 2 ? "text-yellow-400" :
        strength === 3 ? "text-blue-400" : "text-green-400"
      )}>
        {getStrengthText(strength)}
      </p>
    </div>
  );
}
