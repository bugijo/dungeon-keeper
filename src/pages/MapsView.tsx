
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft } from "lucide-react";

const MapsView = () => {
  const { id } = useParams();
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Link to="/maps" className="mr-4">
            <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
          </Link>
          <h1 className="text-3xl font-medievalsharp text-white">Detalhes do Mapa</h1>
        </div>
        
        <div className="fantasy-card p-6">
          <p className="text-fantasy-stone">Visualizando mapa com ID: {id}</p>
          
          {/* Map details would be displayed here */}
          <div className="mt-4 text-white">
            <p>Carregando detalhes do mapa...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MapsView;
