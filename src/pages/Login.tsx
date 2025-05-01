
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { DungeonFormInput } from "@/components/auth/DungeonFormInput";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { Button } from "@/components/ui/button";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { PlayWithoutAccount } from "@/components/auth/PlayWithoutAccount";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Form schema
const formSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const { logIn, googleSignIn, facebookSignIn, anonymousSignIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [playWithoutAccountOpen, setPlayWithoutAccountOpen] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const { error } = await logIn(values.email, values.password);
      
      if (!error) {
        console.log("Login successful, redirecting to home");
        navigate("/");
      } else {
        // Handle Supabase auth errors
        if (error.message.includes("Invalid login")) {
          form.setError("password", { message: "Credenciais inválidas" });
        } else if (error.message.includes("rate limit")) {
          toast.error("🛡️ Portal Bloqueado! Muitas tentativas.");
        } else {
          toast.error("Erro ao fazer login: " + error.message);
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await googleSignIn();
      // O redirecionamento acontece automaticamente via onAuthStateChange
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error("Erro ao fazer login com Google. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setIsLoading(true);
      await facebookSignIn();
      // O redirecionamento acontece automaticamente via onAuthStateChange
    } catch (error) {
      console.error("Facebook sign in error:", error);
      toast.error("Erro ao fazer login com Facebook. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = () => {
    setPlayWithoutAccountOpen(true);
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  return (
    <motion.div 
      className="min-h-screen flex flex-col justify-center items-center p-4 bg-fantasy-dark"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <div className="w-full max-w-md">
        <motion.div 
          className="fantasy-card p-6 shadow-lg"
          variants={staggerContainer}
        >
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h1 className="text-3xl font-medievalsharp text-fantasy-gold">
              Dungeon Keeper
            </h1>
            <p className="text-fantasy-stone/90 mt-2">
              Prepare-se para sua jornada, aventureiro!
            </p>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <DungeonFormInput
                          label="Email"
                          placeholder="seu.email@reino.com"
                          error={fieldState.error?.message}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <DungeonFormInput
                          type="password"
                          label="Senha"
                          placeholder="Sua senha secreta"
                          showPasswordToggle
                          error={fieldState.error?.message}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="flex justify-end"
              >
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-fantasy-purple hover:text-fantasy-gold transition-colors 
                             relative overflow-hidden group"
                >
                  <span>Esqueci minha senha</span>
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-fantasy-gold to-fantasy-purple
                                 origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </button>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="fantasy-button primary w-full py-6"
                >
                  {isLoading ? "Conjurando..." : "Entrar no Reino"}
                </Button>
              </motion.div>
            </form>
          </Form>

          <motion.div 
            variants={itemVariants}
            className="relative my-6 flex items-center"
          >
            <div className="flex-grow border-t border-fantasy-purple/30"></div>
            <span className="mx-4 flex-shrink text-fantasy-stone/70 text-sm font-medievalsharp">ou</span>
            <div className="flex-grow border-t border-fantasy-purple/30"></div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <OAuthButton provider="google" onClick={handleGoogleSignIn} />
            <OAuthButton provider="facebook" onClick={handleFacebookSignIn} />
            <OAuthButton provider="anonymous" onClick={handleAnonymousSignIn} />
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-6 text-center"
          >
            <p className="text-fantasy-stone/90">
              Ainda não tem uma conta?{" "}
              <Link 
                to="/register" 
                className="text-fantasy-purple hover:text-fantasy-gold
                          transition-colors font-medium"
              >
                Inscreva-se na Guilda
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
      
      <PlayWithoutAccount
        isOpen={playWithoutAccountOpen}
        onClose={() => setPlayWithoutAccountOpen(false)}
      />
    </motion.div>
  );
}
