
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireGM?: boolean;
  tableIdParam?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireGM = false, 
  tableIdParam = 'id' 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const params = useParams();
  const [isGM, setIsGM] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(requireGM);

  useEffect(() => {
    const checkGMStatus = async () => {
      if (!user || !requireGM) return;
      
      try {
        setIsChecking(true);
        
        // Obter o ID da tabela diretamente dos parâmetros da URL
        const tableId = params[tableIdParam];
        
        if (!tableId) {
          console.error("Não foi possível encontrar o ID da mesa nos parâmetros da URL", params);
          setIsGM(false);
          setIsChecking(false);
          return;
        }
        
        console.log("Verificando permissões de GM para a mesa:", tableId);
        
        const { data, error } = await supabase
          .from('tables')
          .select('user_id')
          .eq('id', tableId)
          .single();
          
        if (error) {
          console.error("Erro ao verificar status de GM:", error);
          setIsGM(false);
        } else {
          const isGameMaster = data.user_id === user.id;
          console.log("Usuário é GM?", isGameMaster, "User ID:", user.id, "Mesa user_id:", data.user_id);
          setIsGM(isGameMaster);
        }
      } catch (error) {
        console.error("Erro ao verificar status de GM:", error);
        setIsGM(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkGMStatus();
  }, [user, requireGM, params, tableIdParam]);

  if (loading || isChecking) {
    return (
      <div className="h-screen flex justify-center items-center bg-fantasy-dark">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-t-4 border-fantasy-gold rounded-full animate-spin"></div>
          <p className="mt-4 text-fantasy-stone font-medievalsharp">Carregando o reino...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    toast("Você precisa estar logado para acessar esta área", {
      description: "Redirecionando para o portal de entrada...",
    });
    
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  
  if (requireGM && isGM === false) {
    toast.error("Acesso restrito", {
      description: "Apenas mestres podem acessar esta área",
    });
    
    return <Navigate to="/404" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
