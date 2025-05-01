
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const TableCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [system, setSystem] = useState('D&D 5e');
  const [synopsis, setSynopsis] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [weekday, setWeekday] = useState('');
  const [time, setTime] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para criar uma mesa');
      navigate('/login');
      return;
    }
    
    if (!name) {
      toast.error('Por favor, forneça um nome para a mesa');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          name,
          system,
          synopsis,
          max_players: maxPlayers,
          weekday,
          time,
          user_id: user.id,
          status: 'open'
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      toast.success('Mesa criada com sucesso!');
      navigate(`/table/${data.id}`);
    } catch (err: any) {
      console.error('Error creating table:', err);
      toast.error(`Erro ao criar mesa: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const weekdays = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
    'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
  ];
  
  const systems = [
    'D&D 5e', 'Pathfinder', 'Call of Cthulhu', 
    'Vampire: The Masquerade', 'Cyberpunk RED', 
    'GURPS', 'Savage Worlds', 'Tormenta 20', 
    'Outro'
  ];
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/tables')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-medievalsharp text-fantasy-gold">Criar Nova Mesa</h1>
        </div>
        
        <div className="fantasy-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Mesa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome da mesa"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="system">Sistema</Label>
              <Select value={system} onValueChange={setSystem}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent>
                  {systems.map((sys) => (
                    <SelectItem key={sys} value={sys}>{sys}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="synopsis">Sinopse</Label>
              <Textarea
                id="synopsis"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Descreva a sua aventura"
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="maxPlayers">Número Máximo de Jogadores</Label>
              <Input
                id="maxPlayers"
                type="number"
                min={1}
                max={10}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weekday">Dia da Semana</Label>
                <Select value={weekday} onValueChange={setWeekday}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdays.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Ex: 19:00"
                />
              </div>
            </div>
            
            <div className="pt-4 flex gap-3">
              <Button type="submit" className="primary" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Mesa'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/tables')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default TableCreate;
