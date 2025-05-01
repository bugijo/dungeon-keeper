
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-fantasy-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <h1 className="text-6xl font-medievalsharp text-fantasy-gold">404</h1>
        <h2 className="text-2xl font-medievalsharp text-fantasy-purple">
          Masmorra Perdida
        </h2>
        <p className="text-fantasy-stone/90 mt-2">
          O caminho que você buscava desapareceu em meio à névoa mágica ou nunca existiu nos mapas dos reinos.
        </p>
        
        <div className="pt-6">
          <Button
            onClick={() => navigate("/")}
            className="fantasy-button primary"
          >
            Retornar ao Reino Principal
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
