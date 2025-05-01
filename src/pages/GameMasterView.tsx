
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PreSessionScreen from "@/components/game/PreSessionScreen";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { withMasterAccess } from '@/hooks/withMasterAccess';

const GameMasterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tableData, setTableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTableData = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', id)
          .single();
          
        if (tableError) {
          throw tableError;
        }
        
        setTableData(tableData);
        
      } catch (error) {
        console.error('Error fetching table data:', error);
        toast.error('Erro ao carregar dados da mesa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTableData();
  }, [id, user, navigate]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/table/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de convite copiado!');
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="fantasy-card p-6 text-center">
            <p className="text-fantasy-stone animate-pulse">Carregando mesa...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!tableData) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="fantasy-card p-6 text-center">
            <p className="text-fantasy-stone">Mesa não encontrada ou você não tem permissão para acessá-la.</p>
            <Link to="/tables" className="fantasy-button primary mt-4 inline-block">
              Voltar para Mesas
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6 justify-between">
          <div className="flex items-center">
            <Link to="/tables" className="mr-4">
              <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
            </Link>
            <h1 className="text-3xl font-medievalsharp text-white">{tableData.name}</h1>
          </div>
          <Button 
            onClick={copyInviteLink}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Share2 size={16} />
            Convidar
          </Button>
        </div>

        <PreSessionScreen 
          tableId={id || ''} 
          weekday={tableData.weekday}
          time={tableData.time}
        />
      </div>
    </MainLayout>
  );
};

// Exporta o componente com proteção de acesso de mestre
export default withMasterAccess(GameMasterView);
