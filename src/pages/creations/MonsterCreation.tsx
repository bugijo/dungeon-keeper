
import React, { useState } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Save, Plus, Trash2, Skull } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MonsterCreation = () => {
  const [abilities, setAbilities] = useState<{name: string, description: string}[]>([]);
  const [newAbilityName, setNewAbilityName] = useState("");
  const [newAbilityDesc, setNewAbilityDesc] = useState("");
  
  const handleAddAbility = () => {
    if (newAbilityName.trim() && newAbilityDesc.trim()) {
      setAbilities([...abilities, {
        name: newAbilityName.trim(),
        description: newAbilityDesc.trim()
      }]);
      setNewAbilityName("");
      setNewAbilityDesc("");
    }
  };
  
  const handleRemoveAbility = (index: number) => {
    setAbilities(abilities.filter((_, i) => i !== index));
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex items-center mb-6">
          <Link to="/monsters" className="mr-4">
            <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
          </Link>
          <h1 className="text-2xl font-medievalsharp text-white">Criar Novo Monstro</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monster Preview */}
          <div className="md:col-span-1">
            <div className="fantasy-card p-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Pré-visualização</h3>
              
              <div className="h-40 w-full rounded-lg overflow-hidden border-4 border-fantasy-purple/30 mb-4 bg-fantasy-dark/50 flex items-center justify-center">
                <Skull className="text-fantasy-purple/40" size={48} />
              </div>
              
              <h4 className="text-center text-xl font-medievalsharp text-white mb-1">Nome do Monstro</h4>
              <p className="text-center text-fantasy-stone mb-3">Fera Média • ND 2 (450 XP)</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-fantasy-stone">Classe de Armadura:</span>
                  <span className="text-white">14 (armadura natural)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fantasy-stone">Pontos de Vida:</span>
                  <span className="text-white">45 (6d8 + 18)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fantasy-stone">Deslocamento:</span>
                  <span className="text-white">40 pés</span>
                </div>
              </div>
              
              <div className="grid grid-cols-6 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-xs text-fantasy-stone">FOR</div>
                  <div className="text-sm text-white">16 (+3)</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-fantasy-stone">DES</div>
                  <div className="text-sm text-white">14 (+2)</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-fantasy-stone">CON</div>
                  <div className="text-sm text-white">16 (+3)</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-fantasy-stone">INT</div>
                  <div className="text-sm text-white">4 (-3)</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-fantasy-stone">SAB</div>
                  <div className="text-sm text-white">10 (+0)</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-fantasy-stone">CAR</div>
                  <div className="text-sm text-white">7 (-2)</div>
                </div>
              </div>
              
              <div className="bg-fantasy-dark/30 p-3 rounded-lg mb-4">
                <h5 className="text-sm font-medievalsharp text-fantasy-gold mb-2">Habilidades Especiais</h5>
                {abilities.length > 0 ? (
                  <div className="space-y-2">
                    {abilities.map((ability, idx) => (
                      <div key={idx}>
                        <span className="text-white text-sm font-semibold">{ability.name}.</span>
                        <span className="text-fantasy-stone text-sm"> {ability.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-fantasy-stone/50 italic text-sm">
                    Adicione habilidades especiais...
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Monster Form */}
          <div className="md:col-span-2">
            <div className="fantasy-card p-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Informações Básicas</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-fantasy-stone mb-1">Nome</label>
                  <input
                    type="text"
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    placeholder="Digite o nome do monstro"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-fantasy-stone mb-1">Tipo</label>
                    <select
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    >
                      <option value="aberracao">Aberração</option>
                      <option value="besta">Besta</option>
                      <option value="celestial">Celestial</option>
                      <option value="constructo">Constructo</option>
                      <option value="dragao">Dragão</option>
                      <option value="elemental">Elemental</option>
                      <option value="fada">Fada</option>
                      <option value="gigante">Gigante</option>
                      <option value="humanoide">Humanoide</option>
                      <option value="monstruosidade">Monstruosidade</option>
                      <option value="morto-vivo">Morto-vivo</option>
                      <option value="planta">Planta</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-fantasy-stone mb-1">Tamanho</label>
                    <select
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    >
                      <option value="minusculo">Minúsculo</option>
                      <option value="pequeno">Pequeno</option>
                      <option value="medio">Médio</option>
                      <option value="grande">Grande</option>
                      <option value="enorme">Enorme</option>
                      <option value="imenso">Imenso</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-fantasy-stone mb-1">Nível de Desafio</label>
                    <select
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    >
                      <option value="0">0 (0-10 XP)</option>
                      <option value="1/8">1/8 (25 XP)</option>
                      <option value="1/4">1/4 (50 XP)</option>
                      <option value="1/2">1/2 (100 XP)</option>
                      <option value="1">1 (200 XP)</option>
                      <option value="2">2 (450 XP)</option>
                      <option value="3">3 (700 XP)</option>
                      <option value="4">4 (1.100 XP)</option>
                      <option value="5">5 (1.800 XP)</option>
                    </select>
                  </div>
                </div>
                
                {/* Add more form fields here */}
                <div>
                  <label className="block text-fantasy-stone mb-1">Habilidade Especial</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                      placeholder="Nome da habilidade"
                      value={newAbilityName}
                      onChange={(e) => setNewAbilityName(e.target.value)}
                    />
                    <button 
                      className="bg-fantasy-purple px-3 py-1 rounded-lg text-white"
                      onClick={handleAddAbility}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <textarea
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2 min-h-[80px]"
                    placeholder="Descrição da habilidade"
                    value={newAbilityDesc}
                    onChange={(e) => setNewAbilityDesc(e.target.value)}
                  ></textarea>
                </div>
                
                {/* Ability list */}
                {abilities.length > 0 && (
                  <div className="space-y-2 border border-fantasy-purple/20 p-3 rounded-lg">
                    <h4 className="text-sm font-medievalsharp text-fantasy-gold">Habilidades Adicionadas</h4>
                    {abilities.map((ability, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b border-fantasy-purple/10 pb-2">
                        <div>
                          <span className="text-white text-sm font-semibold">{ability.name}</span>
                          <p className="text-fantasy-stone text-xs">{ability.description}</p>
                        </div>
                        <button 
                          className="text-red-400 hover:text-red-300 p-1"
                          onClick={() => handleRemoveAbility(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="pt-4">
                  <button className="w-full bg-fantasy-gold text-fantasy-dark py-2 rounded-lg font-medievalsharp flex items-center justify-center gap-2">
                    <Save size={18} />
                    Salvar Monstro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MonsterCreation;
