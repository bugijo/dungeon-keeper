// src/pages/CreateGameTablePage.tsx
import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CreateGameTablePage: React.FC = () => {
  const [tableName, setTableName] = useState('');
  const [description, setDescription] = useState('');
  const [gameSystem, setGameSystem] = useState('D&D 5e'); // Valor padrão inicial
  const [maxPlayers, setMaxPlayers] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [genre, setGenre] = useState('');
  const [fullStory, setFullStory] = useState('');
  const [tableImage, setTableImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error('Você precisa estar logado para criar uma mesa.');
      return;
    }

    setLoading(true);
    let imageUrl: string | null = null;

    if (tableImage) {
      const fileExt = tableImage.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `public/table_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('game-assets') // Certifique-se que este bucket existe e tem as políticas corretas
        .upload(filePath, tableImage);

      if (uploadError) {
        toast.error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('game-assets')
        .getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    }

    const newTable = {
      name: tableName,
      description: description,
      game_system: gameSystem,
      max_players: parseInt(maxPlayers, 10),
      session_date_time: dateTime ? new Date(dateTime).toISOString() : null,
      genre: genre,
      full_story: fullStory,
      image_url: imageUrl,
      master_id: user.id, // ID do usuário logado como mestre
      // players_count será gerenciado por triggers ou lógica de join
    };

    try {
      const { data, error } = await supabase
        .from('game_tables') // Certifique-se que esta tabela existe
        .insert([newTable])
        .select();

      if (error) {
        throw error;
      }

      toast.success(`Mesa "${tableName}" criada com sucesso!`);
      if (data && data[0]) {
        navigate(`/tables`); // Redireciona para a lista de mesas ou para a página da mesa criada
      } else {
        navigate('/tables');
      }
      // Limpar campos do formulário se necessário, mas o redirecionamento já faz isso

    } catch (error: any) {
      console.error('Erro ao criar mesa:', error);
      toast.error(`Erro ao criar mesa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-800 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">Criar Nova Mesa de Jogo</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-700 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
        <div>
          <label htmlFor="tableName" className="block text-sm font-medium text-yellow-300 mb-1">
            Nome da Mesa
          </label>
          <input
            type="text"
            id="tableName"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-yellow-300 mb-1">
            Descrição Breve
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-yellow-300 mb-1">
            Gênero
          </label>
          <input
            type="text"
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Ex: Fantasia Medieval, Horror Cósmico, Cyberpunk"
            className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="gameSystem" className="block text-sm font-medium text-yellow-300 mb-1">
            Sistema de Jogo
          </label>
          <select
            id="gameSystem"
            value={gameSystem}
            onChange={(e) => setGameSystem(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-white"
          >
            <option value="D&D 5e">Dungeons & Dragons 5ª Edição</option>
            <option value="Pathfinder 2e">Pathfinder 2ª Edição</option>
            <option value="Call of Cthulhu">Chamado de Cthulhu</option>
            <option value="Vampire Masquerade">Vampiro: A Máscara</option>
            <option value="Outro">Outro (especificar na descrição)</option>
          </select>
        </div>

        <div>
          <label htmlFor="maxPlayers" className="block text-sm font-medium text-yellow-300 mb-1">
            Número Máximo de Jogadores
          </label>
          <input
            type="number"
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            min="1"
            className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-yellow-300 mb-1">
            Data e Horário da Próxima Sessão
          </label>
          <input
            type="datetime-local"
            id="dateTime"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="fullStory" className="block text-sm font-medium text-yellow-300 mb-1">
            História Completa
          </label>
          <textarea
            id="fullStory"
            value={fullStory}
            onChange={(e) => setFullStory(e.target.value)}
            rows={6}
            placeholder="Descreva a aventura que aguarda os jogadores..."
            className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-white"
          />
        </div>

        <div>
          <label htmlFor="tableImage" className="block text-sm font-medium text-yellow-300 mb-1">
            Imagem da Mesa (Opcional)
          </label>
          <input
            type="file"
            id="tableImage"
            accept="image/*"
            onChange={(e) => setTableImage(e.target.files ? e.target.files[0] : null)}
            className="mt-1 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-400 file:text-gray-900 hover:file:bg-yellow-500"
          />
        </div>

        {/* Adicionar seleção de história do inventário futuramente */}
        {/* <p className="text-sm text-gray-400">Funcionalidade de seleção de história do inventário será adicionada em breve.</p> */}

        <div>
          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600 focus:ring-offset-gray-800 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Criando Mesa...' : 'Criar Mesa'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGameTablePage;