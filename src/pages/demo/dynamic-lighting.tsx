import React from 'react';
import { NextPage } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DynamicLightingDemo from '@/components/map/DynamicLightingDemo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Flame } from 'lucide-react';
import Link from 'next/link';

const DynamicLightingDemoPage: NextPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="h-6 w-6 text-amber-500" />
          Demonstração de Iluminação Dinâmica
        </h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sobre o Sistema de Iluminação</CardTitle>
          <CardDescription>
            O sistema de iluminação dinâmica complementa o Fog of War, adicionando fontes de luz que revelam áreas e projetam sombras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <p>
              Este sistema permite que o mestre adicione fontes de luz como tochas, lanternas, feitiços mágicos e outros
              elementos que emitem luz no ambiente de jogo. Cada fonte de luz pode ter propriedades únicas como cor,
              intensidade, oscilação (para simular chamas) e projeção de sombras.
            </p>
            <p>
              <strong>Recursos principais:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fontes de luz com raio e intensidade ajustáveis</li>
              <li>Efeitos de oscilação para simular tochas e fogo</li>
              <li>Projeção de sombras quando a luz encontra obstáculos</li>
              <li>Controle de luz ambiente global</li>
              <li>Presets de iluminação para diferentes cenários</li>
              <li>Integração com o sistema de Fog of War</li>
            </ul>
            <p>
              <strong>Como usar:</strong> Arraste as fontes de luz para posicioná-las no mapa. Use o painel de controle
              para ajustar as propriedades das luzes ou adicionar novas fontes. Observe como as luzes interagem com os
              obstáculos, projetando sombras realistas.
            </p>
          </div>
        </CardContent>
      </Card>

      <DynamicLightingDemo />
    </div>
  );
};

export default DynamicLightingDemoPage;