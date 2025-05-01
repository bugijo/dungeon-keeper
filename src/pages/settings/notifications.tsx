import React from 'react';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { PageHeader } from '@/components/ui/page-header';
import { Bell } from 'lucide-react';
import { SettingsLayout } from '@/components/layouts/SettingsLayout';

export default function NotificationsSettingsPage() {
  return (
    <SettingsLayout>
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader
          title="Configurações de Notificação"
          description="Personalize como você recebe notificações no Keeper of Realms"
          icon={<Bell className="h-6 w-6 text-fantasy-gold" />}
        />
        
        <div className="mt-8">
          <NotificationSettings />
        </div>
      </div>
    </SettingsLayout>
  );
}