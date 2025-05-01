
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DungeonFormInput } from "./DungeonFormInput";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form schema
const formSchema = z.object({
  email: z.string().email("Pergaminho inválido! Insira um email correto."),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      await resetPassword(values.email);
      setIsSuccess(true);
    } catch (error) {
      console.error("Error resetting password:", error);
      form.setError("email", { 
        message: "Feitiço falhou! Tente novamente ou contate um mestre mago." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fantasy-card bg-fantasy-dark max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-fantasy-gold font-medievalsharp">
            Recuperar Senha
          </DialogTitle>
          <DialogDescription className="text-fantasy-stone/80">
            {!isSuccess 
              ? "Esqueceu seu pergaminho mágico? Informe seu email para receber um feitiço de recuperação."
              : "Um feitiço de recuperação foi enviado. Verifique seu email para restaurar seu acesso ao reino."}
          </DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="fantasy-button w-full sm:w-auto"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  className="fantasy-button primary w-full sm:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando Feitiço..." : "Enviar Feitiço"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="p-4 rounded-full bg-fantasy-purple/20 border border-fantasy-purple/40">
              <div className="h-16 w-16 text-fantasy-gold">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
            </div>
            
            <Button
              className="fantasy-button primary w-full sm:w-auto"
              onClick={onClose}
            >
              Fechar Portal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
