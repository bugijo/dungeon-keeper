import { z } from "zod";

export const characterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  class: z.string().min(1, "Classe é obrigatória"),
  race: z.string().min(1, "Raça é obrigatória"),
  level: z.number().min(1).max(20),
  strength: z.number().min(1).max(20),
  dexterity: z.number().min(1).max(20),
  constitution: z.number().min(1).max(20),
  intelligence: z.number().min(1).max(20),
  wisdom: z.number().min(1).max(20),
  charisma: z.number().min(1).max(20),
  background: z.string().optional(),
  alignment: z.string().optional(),
  imageUrl: z.string().url().optional(),
  // Adicione outros campos conforme necessário
});

export type CharacterSchema = z.infer<typeof characterSchema>;