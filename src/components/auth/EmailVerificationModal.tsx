
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { motion } from "framer-motion";
import { Check, RefreshCw } from "lucide-react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function EmailVerificationModal({ isOpen, onClose, email }: EmailVerificationModalProps) {
  const { verifyEmail } = useAuth();
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutos
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Formata o tempo do contador
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Manipula reenvio de email
  const handleResend = async () => {
    try {
      await verifyEmail();
      setResendDisabled(true);
      setResendCountdown(60);
    } catch (error) {
      console.error("Erro ao reenviar email de verificação:", error);
    }
  };

  // Temporizador para expiração da verificação
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen]);

  // Temporizador para o botão de reenvio
  useEffect(() => {
    if (resendCountdown <= 0) {
      setResendDisabled(false);
      return;
    }
    
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendCountdown]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fantasy-card bg-fantasy-dark max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-fantasy-gold font-medievalsharp">
            Verificação de Email
          </DialogTitle>
          <DialogDescription className="text-fantasy-stone/80">
            Um feitiço mágico foi enviado para <span className="text-fantasy-gold">{email}</span>.
            Verifique sua caixa de mensagens para completar o ritual de verificação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          <motion.div 
            className="w-24 h-24 rounded-full flex items-center justify-center"
            animate={{ 
              boxShadow: ["0 0 10px #6E59A5", "0 0 20px #6E59A5", "0 0 10px #6E59A5"] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Check className="h-12 w-12 text-fantasy-purple" />
          </motion.div>
          
          <div className="text-center">
            <p className="text-fantasy-gold/90 font-medievalsharp">
              O feitiço expira em
            </p>
            <div className="text-2xl text-fantasy-gold font-medievalsharp">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="fantasy-button secondary w-full sm:w-auto order-2 sm:order-1"
            onClick={onClose}
          >
            Fechar Portal
          </Button>
          
          <Button
            className="fantasy-button primary w-full sm:w-auto order-1 sm:order-2 flex items-center gap-2"
            onClick={handleResend}
            disabled={resendDisabled}
          >
            <RefreshCw className="h-4 w-4" />
            {resendDisabled 
              ? `Reenviar em ${resendCountdown}s` 
              : "Reenviar Feitiço"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
