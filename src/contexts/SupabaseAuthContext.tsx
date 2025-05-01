
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  logIn: (email: string, password: string) => Promise<{ error: any }>;
  logOut: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  facebookSignIn: () => Promise<void>;
  anonymousSignIn: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

const messages = {
  loginSuccess: (nome: string) => `🔥 Tochas Acesas! Bem-vindo, ${nome || 'Aventureiro'}!`,
  loginError: "🧙 Magia Falhou! Credenciais incorretas.",
  signupSuccess: "🛡️ Bem-vindo à Guilda! Verifique seu email.",
  signupError: "🪶 Pergaminho Danificado! Não foi possível criar conta.",
  accountLocked: "🛡️ Portal Bloqueado! Muitas tentativas.",
  resetPassword: "🔮 Feitiço Enviado! Verifique seu email.",
  logoutSuccess: "🌙 As tochas foram apagadas! Até a próxima aventura!",
  verifyEmail: "📜 Pergaminho enviado! Verifique seu email.",
  genericError: "🧝‍♂️ Por elfos! Algo deu errado."
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Primeiro configuramos o listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session) {
          toast.success(messages.loginSuccess(session.user?.user_metadata?.name || ''));
        }
        
        if (event === 'SIGNED_OUT') {
          toast.success(messages.logoutSuccess);
        }
      }
    );

    // Depois verificamos a sessão atual
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Got initial session:", session?.user?.email);
        
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (error) {
        console.error("Erro ao buscar sessão:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkCurrentSession();

    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      if (!error) {
        toast.success(messages.signupSuccess);
      } else {
        toast.error(error.message);
      }
      
      return { error };
    } catch (error: any) {
      toast.error(messages.signupError);
      return { error };
    }
  };

  const logIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        toast.error(messages.loginError);
      }
      
      return { error };
    } catch (error: any) {
      toast.error(messages.loginError);
      return { error };
    }
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    }
  };

  const googleSignIn = async () => {
    console.log("Google sign in initiated");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error("Erro ao autenticar com Google:", error);
        toast.error(error.message);
        throw error;
      }
    } catch (error: any) {
      console.error("Exceção ao autenticar com Google:", error);
      toast.error(messages.genericError);
      throw error;
    }
  };

  const facebookSignIn = async () => {
    console.log("Facebook sign in initiated");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
          scopes: 'public_profile,email'
        }
      });
      
      if (error) {
        console.error("Erro ao autenticar com Facebook:", error);
        toast.error(error.message);
        throw error;
      }
    } catch (error: any) {
      console.error("Exceção ao autenticar com Facebook:", error);
      toast.error(messages.genericError);
      throw error;
    }
  };

  const anonymousSignIn = async () => {
    console.log("Anonymous sign in initiated");
    try {
      const randomEmail = `demo_${Math.random().toString(36).substring(2, 15)}@example.com`;
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email: randomEmail,
        password: randomPassword
      });
      
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: randomEmail,
          password: randomPassword,
          options: {
            data: {
              name: "Aventureiro Anônimo"
            }
          }
        });
        
        if (signUpError) {
          console.error("Erro ao criar usuário anônimo:", signUpError);
          toast.error(messages.genericError);
          throw signUpError;
        }
        
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: randomEmail,
          password: randomPassword
        });
        
        if (loginError) {
          console.error("Erro ao fazer login anônimo:", loginError);
          toast.error(messages.genericError);
          throw loginError;
        }
        
        toast.success(messages.loginSuccess("Aventureiro Anônimo"));
      } else {
        toast.success(messages.loginSuccess("Aventureiro Anônimo"));
      }
    } catch (error: any) {
      console.error("Exceção ao criar login anônimo:", error);
      toast.error(messages.genericError);
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success(messages.resetPassword);
    } catch (error: any) {
      toast.error("Erro ao resetar senha: " + error.message);
      throw error;
    }
  };

  const verifyEmail = async () => {
    try {
      if (!user || !session) {
        throw new Error("Usuário não está autenticado");
      }
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email || '',
        options: {
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success(messages.verifyEmail);
    } catch (error: any) {
      toast.error("Erro ao enviar email de verificação: " + error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      logIn,
      logOut,
      googleSignIn,
      facebookSignIn,
      anonymousSignIn,
      updateUserProfile,
      resetPassword,
      verifyEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};
