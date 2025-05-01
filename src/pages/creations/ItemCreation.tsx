
import React, { useState } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Plus, Trash2, Upload, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ItemCreation = () => {
  const [itemType, setItemType] = useState("weapon");
  const [properties, setProperties] = useState<string[]>([]);
  const [newProperty, setNewProperty] = useState("");
  
  const handleAddProperty = () => {
    if (newProperty.trim()) {
      setProperties([...properties, newProperty.trim()]);
      setNewProperty("");
    }
  };
  
  const handleRemoveProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex items-center mb-6">
          <Link to="/items" className="mr-4">
            <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
          </Link>
          <h1 className="text-2xl font-medievalsharp text-white">Criar Novo Item</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Item Preview */}
          <div className="md:col-span-1">
            <div className="fantasy-card p-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Pré-visualização</h3>
              
              <div className="h-48 w-full bg-fantasy-dark/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                <Upload className="text-fantasy-purple/40" size={32} />
              </div>
              
              <div className="mb-2">
                <h4 className="text-xl font-medievalsharp text-white">Nome do Item</h4>
                <div className="flex items-center gap-2 text-sm text-fantasy-stone">
                  <span className="capitalize">{itemType}</span>
                  <span>•</span>
                  <span className="capitalize">Raro</span>
                </div>
              </div>
              
              <p className="text-fantasy-stone text-sm mb-4">
                Descrição do item aparecerá aqui...
              </p>
              
              <div className="flex flex-wrap gap-1 mt-3">
                {properties.map((prop, idx) => (
                  <span key={idx} className="text-xs bg-fantasy-dark px-2 py-0.5 rounded text-fantasy-stone">
                    {prop}
                  </span>
                ))}
                {properties.length === 0 && (
                  <span className="text-xs bg-fantasy-dark px-2 py-0.5 rounded text-fantasy-stone/50">
                    Nenhuma propriedade
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Form */}
          <div className="md:col-span-2">
            <div className="fantasy-card p-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Informações Básicas</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-fantasy-stone mb-1">Nome do Item</label>
                  <input
                    type="text"
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    placeholder="Digite o nome do item"
                  />
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Tipo de Item</label>
                  <select
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                  >
                    <option value="weapon">Arma</option>
                    <option value="armor">Armadura</option>
                    <option value="shield">Escudo</option>
                    <option value="wand">Varinha</option>
                    <option value="potion">Poção</option>
                    <option value="scroll">Pergaminho</option>
                    <option value="ring">Anel</option>
                    <option value="wonderous">Item Maravilhoso</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Raridade</label>
                  <select
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                  >
                    <option value="comum">Comum</option>
                    <option value="incomum">Incomum</option>
                    <option value="raro">Raro</option>
                    <option value="muito_raro">Muito Raro</option>
                    <option value="lendario">Lendário</option>
                    <option value="artefato">Artefato</option>
                  </select>
                </div>
                
                {itemType === 'weapon' && (
                  <div>
                    <label className="block text-fantasy-stone mb-1">Dano</label>
                    <input
                      type="text"
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                      placeholder="Ex: 1d8+1"
                    />
                  </div>
                )}
                
                {(itemType === 'armor' || itemType === 'shield') && (
                  <div>
                    <label className="block text-fantasy-stone mb-1">Classe de Armadura</label>
                    <input
                      type="text"
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                      placeholder="Ex: +2 ou 16"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Descrição</label>
                  <textarea
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2 min-h-[100px]"
                    placeholder="Descreva o item e suas funcionalidades..."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Imagem</label>
                  <div className="flex">
                    <input
                      type="text"
                      className="flex-1 bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-l-lg p-2"
                      placeholder="URL da imagem ou arraste um arquivo"
                    />
                    <button className="bg-fantasy-purple text-white px-3 rounded-r-lg">
                      <Upload size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Properties */}
                <div>
                  <label className="block text-fantasy-stone mb-1">Propriedades</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-l-lg p-2"
                      placeholder="Adicionar propriedade (ex: mágico, requer sintonia)"
                      value={newProperty}
                      onChange={(e) => setNewProperty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddProperty()}
                    />
                    <button 
                      className="bg-fantasy-purple text-white px-3 rounded-r-lg"
                      onClick={handleAddProperty}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {properties.map((prop, idx) => (
                      <div key={idx} className="bg-fantasy-dark flex items-center gap-1 px-2 py-1 rounded-full">
                        <span className="text-sm text-fantasy-stone">{prop}</span>
                        <button 
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleRemoveProperty(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Link to="/items">
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
                  Salvar Item
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ItemCreation;
