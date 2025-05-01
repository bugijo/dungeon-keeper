import React from 'react';
import { QuickNotes } from '@/components/dm/QuickNotes';
import { useSession } from '@/hooks/useSession';
import { useUser } from '@/hooks/useUser';

/**
 * Exemplo de uso do componente QuickNotes com integração Supabase
 * Este componente demonstra como utilizar o QuickNotes com sincronização em tempo real
 */
export function QuickNotesExample() {
  // Obter informações da sessão e usuário atual
  const { session } = useSession();
  const { user } = useUser();
  
  // Manipuladores de eventos (opcional)
  const handleNoteAdd = (note) => {
    console.log('Nota adicionada:', note);
  };
  
  const handleNoteUpdate = (note) => {
    console.log('Nota atualizada:', note);
  };
  
  const handleNoteDelete = (noteId) => {
    console.log('Nota excluída:', noteId);
  };
  
  return (
    <div className="p-4 bg-amber-950/30 rounded-lg border border-amber-800/50">
      <h2 className="text-xl font-medievalsharp text-amber-200 mb-4">Notas Rápidas do Mestre</h2>
      
      <QuickNotes 
        // Habilitar sincronização com Supabase
        syncWithSupabase={true}
        // Passar IDs necessários para sincronização
        sessionId={session?.id}
        userId={user?.id}
        // Manipuladores de eventos (opcional)
        onNoteAdd={handleNoteAdd}
        onNoteUpdate={handleNoteUpdate}
        onNoteDelete={handleNoteDelete}
      />
      
      <div className="mt-6 p-3 bg-amber-900/30 rounded border border-amber-800/30">
        <h3 className="text-sm font-medievalsharp text-amber-300">Instruções de Uso:</h3>
        <ul className="text-xs text-amber-200/80 mt-2 space-y-1">
          <li>• Crie notas rápidas para lembrar informações importantes durante a sessão</li>
          <li>• As notas são sincronizadas automaticamente entre dispositivos</li>
          <li>• Use cores diferentes para categorizar suas notas</li>
          <li>• Fixe notas importantes para mantê-las no topo da lista</li>
          <li>• Clique em "Sincronizar" para forçar a sincronização manual</li>
        </ul>
      </div>
    </div>
  );
}