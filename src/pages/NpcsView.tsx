import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import NPCsPage from './npcs';
// Redirecionando para o novo componente de NPCs que utiliza o serviço npcAiService

// Usando a interface NPC do serviço npcAiService

const NpcsView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  return (
    <MainLayout>
      <NPCsPage />
    </MainLayout>
  );
};
  
export default NpcsView;
