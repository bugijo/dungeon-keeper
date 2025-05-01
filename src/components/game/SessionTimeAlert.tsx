
import React, { useEffect } from 'react';
import { Clock, Bell } from 'lucide-react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"
import { toast } from 'sonner';

interface SessionTimeAlertProps {
  scheduledTime?: string;
  weekday?: string;
}

const SessionTimeAlert = ({ scheduledTime, weekday }: SessionTimeAlertProps) => {
  useEffect(() => {
    if (!scheduledTime || !weekday) return;

    const checkGameTime = () => {
      const now = new Date();
      const currentWeekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const [hours, minutes] = scheduledTime.split(':');
      const gameTime = new Date();
      gameTime.setHours(parseInt(hours), parseInt(minutes), 0);

      if (currentWeekday === weekday.toLowerCase() &&
          now.getHours() === gameTime.getHours() &&
          now.getMinutes() === gameTime.getMinutes()) {
        toast("Hora do Jogo!", {
          description: "A sessão está programada para começar agora!",
          duration: 10000,
        });
      }
    };

    const interval = setInterval(checkGameTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [scheduledTime, weekday]);

  if (!scheduledTime || !weekday) return null;

  return (
    <Alert className="mb-4 bg-fantasy-dark/40 border-fantasy-purple/30">
      <Bell className="h-4 w-4 text-fantasy-purple" />
      <AlertTitle className="text-white">Próxima Sessão</AlertTitle>
      <AlertDescription className="text-fantasy-stone flex items-center gap-2">
        <Clock size={14} />
        {weekday} às {scheduledTime}
      </AlertDescription>
    </Alert>
  );
};

export default SessionTimeAlert;
