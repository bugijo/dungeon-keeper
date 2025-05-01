
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { DungeonFormInput } from "@/components/auth/DungeonFormInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { Button } from "@/components/ui/button";
import { EmailVerificationModal } from "@/components/auth/EmailVerificationModal";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { motion } from "framer-motion";
import { Sword, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

// Form schema
const formSchema = z.object({
  step: z.number(),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  passwordConfirm: z.string(),
  displayName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "As senhas não conferem",
  path: ["passwordConfirm"],
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const { signUp, updateUserProfile, googleSignIn, facebookSignIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      step: 1,
      email: "",
      password: "",
      passwordConfirm: "",
      displayName: "",
    },
  });

  const nextStep = () => {
    if (step === 1) {
      form.trigger("email").then((isValid) => {
        if (isValid) setStep(2);
      });
    } else if (step === 2) {
      form.trigger(["password", "passwordConfirm"]).then((isValid) => {
        if (isValid) setStep(3);
      });
    }
  };

  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  // Function to check and update tables if needed
  const ensureTablesExist = async () => {
    try {
      const response = await fetch('/api/ensure-tables', {
        method: 'POST',
      });
      if (!response.ok) console.error('Error ensuring tables exist:', response.statusText);
    } catch (err) {
      console.error('Failed to ensure tables exist:', err);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      // Attempt to ensure tables exist first
      await ensureTablesExist();
      
      // First, create the user account with Supabase
      const { error } = await signUp(values.email, values.password);
      
      if (!error) {
        // Set user's display name in metadata
        await updateUserProfile(values.displayName);
        
        // Show verification modal
        setRegisteredEmail(values.email);
        setVerificationModalOpen(true);
        toast.success("Conta criada com sucesso! Verifique seu email.");
      } else {
        console.error("Signup error:", error.message);
        // Handle Supabase auth errors
        if (error.message.includes("already registered")) {
          form.setError("email", { 
            message: "Este email já está em uso" 
          });
          setStep(1);
          toast.error("Este email já está cadastrado. Tente outro email.");
        } else {
          form.setError("email", { 
            message: "Erro ao criar conta. Tente novamente." 
          });
          toast.error("Erro ao criar conta. Tente novamente.");
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      transition: { duration: 0.4 }
    })
  };

  const stepsContent = [
    // Step 1: Email
    <motion.div 
      key="step1"
      custom={step > 1 ? -1 : 1}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-4"
    >
      <div className="flex items-center justify-center mb-4">
        <div className="h-16 w-16 bg-fantasy-purple/20 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-fantasy-gold" />
        </div>
      </div>
      
      <h2 className="text-xl font-medievalsharp text-fantasy-gold text-center">
        Seu Endereço de Pergaminho
      </h2>
      
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
      
      <Button 
        type="button" 
        onClick={nextStep}
        className="fantasy-button primary w-full py-6 mt-4"
      >
        Próximo Passo
      </Button>
    </motion.div>,
    
    // Step 2: Password
    <motion.div 
      key="step2"
      custom={step > 2 ? -1 : 1}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-4"
    >
      <div className="flex items-center justify-center mb-4">
        <div className="h-16 w-16 bg-fantasy-purple/20 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 text-fantasy-gold" />
        </div>
      </div>
      
      <h2 className="text-xl font-medievalsharp text-fantasy-gold text-center">
        Crie uma Senha Forte
      </h2>
      
      <FormField
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <FormItem className="space-y-1">
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
            <PasswordStrengthMeter password={field.value} />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="passwordConfirm"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <DungeonFormInput
                type="password"
                label="Confirme sua senha"
                placeholder="Digite novamente sua senha"
                showPasswordToggle
                error={fieldState.error?.message}
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <div className="flex gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="fantasy-button w-1/3"
        >
          Voltar
        </Button>
        <Button 
          type="button" 
          onClick={nextStep}
          className="fantasy-button primary w-2/3"
        >
          Próximo Passo
        </Button>
      </div>
    </motion.div>,
    
    // Step 3: Display Name
    <motion.div 
      key="step3"
      custom={1}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-4"
    >
      <div className="flex items-center justify-center mb-4">
        <div className="h-16 w-16 bg-fantasy-purple/20 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-fantasy-gold" />
        </div>
      </div>
      
      <h2 className="text-xl font-medievalsharp text-fantasy-gold text-center">
        Como devemos chamá-lo?
      </h2>
      
      <FormField
        control={form.control}
        name="displayName"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <DungeonFormInput
                label="Nome de Aventureiro"
                placeholder="Sir Lancelot, Gandalf, etc."
                error={fieldState.error?.message}
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <div className="flex gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="fantasy-button w-1/3"
        >
          Voltar
        </Button>
        <Button 
          type="submit"
          disabled={isLoading}
          className="fantasy-button primary w-2/3"
        >
          {isLoading ? "Registrando..." : "Juntar-se à Guilda"}
        </Button>
      </div>
    </motion.div>
  ];

  // Step indicators
  const stepsIndicator = [
    { icon: Mail, label: "Email" },
    { icon: Lock, label: "Senha" },
    { icon: User, label: "Perfil" }
  ];
  
  return (
    <motion.div 
      className="min-h-screen flex flex-col justify-center items-center p-4 bg-fantasy-dark"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <div className="w-full max-w-md">
        <div className="fantasy-card p-6 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-medievalsharp text-fantasy-gold">
              Juntar-se à Guilda
            </h1>
          </div>

          {/* Steps indicator */}
          <div className="flex justify-between mb-8">
            {stepsIndicator.map((stepItem, index) => {
              const StepIcon = stepItem.icon;
              const isActive = step === index + 1;
              const isCompleted = step > index + 1;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center 
                      ${isActive 
                        ? 'bg-fantasy-purple text-white' 
                        : isCompleted 
                          ? 'bg-fantasy-gold text-fantasy-dark' 
                          : 'bg-fantasy-dark/80 text-fantasy-stone/60 border border-fantasy-stone/30'}
                      ${index === 0 ? 'rounded-l-full' : ''}
                      ${index === stepsIndicator.length - 1 ? 'rounded-r-full' : ''}
                      transition-all duration-300
                    `}
                  >
                    {isCompleted ? (
                      <Sword className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span 
                    className={`
                      text-xs mt-1 font-medievalsharp
                      ${isActive 
                        ? 'text-fantasy-gold' 
                        : isCompleted 
                          ? 'text-fantasy-gold/80' 
                          : 'text-fantasy-stone/60'}
                    `}
                  >
                    {stepItem.label}
                  </span>
                  
                  {/* Connector line */}
                  {index < stepsIndicator.length - 1 && (
                    <div className="absolute w-[calc(33%-20px)] h-0.5 bg-fantasy-dark/40 left-[calc(33%+10px)] translate-y-5"
                         style={{ 
                           background: isCompleted 
                             ? 'linear-gradient(to right, #ffd700, #6E59A5)' 
                             : '#2b1b36'
                         }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="relative overflow-hidden">
                {stepsContent[step - 1]}
              </div>
            </form>
          </Form>

          <div className="mt-8 text-center border-t border-fantasy-purple/20 pt-4">
            <p className="text-fantasy-stone/90">
              Já tem uma conta?{" "}
              <Link 
                to="/login" 
                className="text-fantasy-purple hover:text-fantasy-gold
                          transition-colors font-medium"
              >
                Entrar no Reino
              </Link>
            </p>
          </div>
        </div>
      </div>

      <EmailVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          navigate("/login");
        }}
        email={registeredEmail}
      />
    </motion.div>
  );
}
