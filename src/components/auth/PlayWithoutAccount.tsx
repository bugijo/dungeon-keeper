import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { DungeonFormInput } from './DungeonFormInput';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

// Form schema
const formSchema = z.object({
  displayName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(30, 'Nome muito longo'),
  experienceLevel: z.enum(['iniciante', 'intermediario', 'experiente']),
});

type FormValues = z.infer<typeof formSchema>;

interface PlayWithoutAccountProps {
  onClose: () => void;
  isOpen: boolean;
}

export function PlayWithoutAccount({ onClose, isOpen }: PlayWithoutAccountProps) {
  const { anonymousSignIn, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      experienceLevel: 'iniciante',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      await anonymousSignIn();
      
      // Atualiza o perfil com o nome escolhido
      await updateUserProfile(values.displayName);
      
      // Armazena o nível de experiência no localStorage
      localStorage.setItem('experienceLevel', values.experienceLevel);
      
      toast.success(`🎲 Bem-vindo, ${values.displayName}! Sua aventura começa agora!`);
      navigate('/');
    } catch (error) {
      console.error('Erro ao entrar sem conta:', error);
      toast.error('Não foi possível entrar no modo sem conta. Tente novamente.');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
  };

  const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={overlayVariants}
      onClick={onClose}
    >
      <motion.div 
        className="bg-fantasy-dark border border-fantasy-purple/30 rounded-lg shadow-xl w-full max-w-md p-6"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-fantasy-purple/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-fantasy-gold" />
            </div>
          </div>
          <h2 className="text-2xl font-medievalsharp text-fantasy-gold">Jogar sem Conta</h2>
          <p className="text-fantasy-stone/90 mt-2">
            Escolha um nome e nível de experiência para começar sua jornada!
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <motion.div variants={formItemVariants}>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <DungeonFormInput
                        label="Nome do Aventureiro"
                        placeholder="Como deseja ser chamado?"
                        error={fieldState.error?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={formItemVariants} className="space-y-2">
              <label className="text-sm font-medievalsharp text-fantasy-stone">
                Nível de Experiência
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => form.setValue('experienceLevel', 'iniciante')}
                  className={`p-3 rounded-md border transition-all ${form.watch('experienceLevel') === 'iniciante' ? 'border-fantasy-gold bg-fantasy-purple/20 text-fantasy-gold' : 'border-fantasy-purple/30 text-fantasy-stone/70 hover:border-fantasy-purple/50'}`}
                >
                  Iniciante
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('experienceLevel', 'intermediario')}
                  className={`p-3 rounded-md border transition-all ${form.watch('experienceLevel') === 'intermediario' ? 'border-fantasy-gold bg-fantasy-purple/20 text-fantasy-gold' : 'border-fantasy-purple/30 text-fantasy-stone/70 hover:border-fantasy-purple/50'}`}
                >
                  Intermediário
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('experienceLevel', 'experiente')}
                  className={`p-3 rounded-md border transition-all ${form.watch('experienceLevel') === 'experiente' ? 'border-fantasy-gold bg-fantasy-purple/20 text-fantasy-gold' : 'border-fantasy-purple/30 text-fantasy-stone/70 hover:border-fantasy-purple/50'}`}
                >
                  Experiente
                </button>
              </div>
            </motion.div>

            <motion.div variants={formItemVariants} className="pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="fantasy-button primary w-full py-6"
              >
                {isLoading ? "Preparando aventura..." : "Começar Aventura"}
              </Button>
            </motion.div>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  );
}