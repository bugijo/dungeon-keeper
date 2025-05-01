
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export const WelcomeSection = () => {
  const { user } = useAuth();
  
  return (
    <section className="mb-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fantasy-card p-6"
      >
        <h1 className="text-2xl font-medievalsharp text-fantasy-gold mb-2">
          Bem-vindo{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ' Aventureiro'}!
        </h1>
        <p className="text-fantasy-stone">
          Prepare-se para uma jornada épica no mundo do RPG!
        </p>
      </motion.div>
    </section>
  );
};
