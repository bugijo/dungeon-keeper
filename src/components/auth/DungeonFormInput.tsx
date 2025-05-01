
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface DungeonFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
}

const DungeonFormInput = React.forwardRef<HTMLInputElement, DungeonFormInputProps>(
  ({ className, label, error, showPasswordToggle, type = "text", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = showPasswordToggle 
      ? showPassword ? "text" : "password" 
      : type;

    return (
      <div className="space-y-2 w-full">
        <Label 
          htmlFor={props.id} 
          className="font-medievalsharp text-fantasy-gold block"
        >
          {label}
        </Label>
        <div className={cn(
          "fantasy-border relative overflow-hidden transition-all",
          isFocused && "border-fantasy-purple", 
          error && "border-destructive"
        )}>
          <Input
            type={inputType}
            className={cn(
              "bg-fantasy-dark/80 border-none text-foreground p-3",
              "placeholder:text-fantasy-stone/70",
              "focus:ring-0 focus:ring-offset-0",
              error && "border-destructive",
              className
            )}
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {showPasswordToggle && (
            <button 
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fantasy-purple hover:text-fantasy-gold transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        
        {error && (
          <p className="text-destructive text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

DungeonFormInput.displayName = "DungeonFormInput";

export { DungeonFormInput };
