
import React, { useState } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Plus, Trash2, Save, BookOpen, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const StoryCreation = () => {
  const [storyType, setStoryType] = useState("main_quest");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };
  
  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };
  
  const suggestedTags = ["Dungeon", "Mistério", "Combate", "Cidade", "Floresta", "Drama", "Horror", "Tesouro", "Encontro", "NPC"];
  
  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex items-center mb-6">
          <Link to="/stories" className="mr-4">
            <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
          </Link>
          <h1 className="text-2xl font-medievalsharp text-white">Criar Nova História</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Story Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="fantasy-card p-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Informações Básicas</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-fantasy-stone mb-1">Título</label>
                  <input
                    type="text"
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    placeholder="Digite o título da história"
                  />
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Tipo de História</label>
                  <select
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    value={storyType}
                    onChange={(e) => setStoryType(e.target.value)}
                  >
                    <option value="main_quest">Quest Principal</option>
                    <option value="side_quest">Quest Secundária</option>
                    <option value="background">História de Fundo</option>
                    <option value="lore">Lore do Mundo</option>
                    <option value="encounter">Encontro</option>
                  </select>
                </div>
                
                {/* Tags */}
                <div>
                  <label className="flex items-center text-fantasy-stone mb-1">
                    <Tags size={16} className="mr-1" />
                    Tags
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-l-lg p-2"
                      placeholder="Adicionar tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <button 
                      className="bg-fantasy-purple text-white px-3 rounded-r-lg"
                      onClick={handleAddTag}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, idx) => (
                      <div key={idx} className="bg-fantasy-dark flex items-center gap-1 px-2 py-1 rounded-full">
                        <span className="text-sm text-fantasy-stone">{tag}</span>
                        <button 
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleRemoveTag(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-fantasy-stone mb-2">Tags sugeridas:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestedTags.map((tag) => (
                        <button
                          key={tag}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            tags.includes(tag) 
                              ? 'bg-fantasy-purple/50 text-white cursor-not-allowed' 
                              : 'bg-fantasy-dark/50 text-fantasy-stone hover:bg-fantasy-dark'
                          }`}
                          onClick={() => {
                            if (!tags.includes(tag)) {
                              setTags([...tags, tag]);
                            }
                          }}
                          disabled={tags.includes(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="fantasy-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medievalsharp text-white">Prévia</h3>
                <BookOpen className="text-fantasy-purple" size={20} />
              </div>
              
              <div className="border-l-2 border-fantasy-purple/30 pl-4 py-2">
                <h4 className="text-lg font-medievalsharp text-white">Título da História</h4>
                <div className="flex flex-wrap gap-1 mt-1 mb-3">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-fantasy-dark px-2 py-0.5 rounded text-fantasy-stone">
                      {tag}
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs bg-fantasy-dark px-2 py-0.5 rounded text-fantasy-stone/50">
                      Sem tags
                    </span>
                  )}
                </div>
                <p className="text-fantasy-stone text-sm italic">
                  "O começo da sua história aparecerá aqui..."
                </p>
              </div>
            </div>
          </div>
          
          {/* Story Content */}
          <div className="lg:col-span-2">
            <div className="fantasy-card p-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Conteúdo da História</h3>
              
              <div className="mb-6">
                <label className="block text-fantasy-stone mb-1">Editor</label>
                <textarea
                  className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-4 min-h-[400px] font-serif leading-relaxed"
                  placeholder="Era uma vez, em um reino distante..."
                ></textarea>
              </div>
              
              <div className="flex justify-between">
                <div className="text-xs text-fantasy-stone flex items-center">
                  <span className="mr-1">Dica:</span>
                  <span>Use marcações como # para títulos e * para itálico</span>
                </div>
                
                <div className="flex gap-3">
                  <Link to="/stories">
                    <button className="bg-fantasy-dark text-fantasy-stone py-2 px-4 rounded-lg">
                      Cancelar
                    </button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-fantasy-gold text-fantasy-dark py-2 px-6 rounded-lg font-medievalsharp flex items-center gap-2"
                  >
                    <Save size={18} />
                    Salvar História
                  </motion.button>
                </div>
              </div>
            </div>
            
            <div className="fantasy-card p-6 mt-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Notas Adicionais</h3>
              
              <div className="mb-4">
                <label className="block text-fantasy-stone mb-1">Notas para o Mestre (não visíveis para jogadores)</label>
                <textarea
                  className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-4 min-h-[150px]"
                  placeholder="Adicione notas sobre hooks de história, dicas de interpretação ou segredos da trama..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-fantasy-stone mb-1">Referências & Inspirações</label>
                <textarea
                  className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-4 min-h-[100px]"
                  placeholder="Livros, filmes, séries ou outras fontes que inspiraram esta história..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StoryCreation;
