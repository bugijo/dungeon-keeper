
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Lidando com requisições OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Configuração do cliente Supabase
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Sem autorização' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Você pode obter estas variáveis das env vars ou de secrets
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://iilbczoanafeqzjqovjb.supabase.co";
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Obter todas as mesas com sessões agendadas para hoje
    const now = new Date();
    const today = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
    
    // Obter sessões que acontecerão hoje
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('id, name, time, user_id, weekday')
      .eq('weekday', today)
      .eq('status', 'open');
      
    if (tableError) throw tableError;

    const notifications = [];
    
    for (const table of tables || []) {
      // Parse time e calcule se está dentro de 30 minutos
      if (!table.time) continue;
      
      const [hours, minutes] = table.time.split(':').map(Number);
      const sessionTime = new Date();
      sessionTime.setHours(hours, minutes, 0, 0);
      
      const timeDiffMs = sessionTime.getTime() - now.getTime();
      const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
      
      // Verificar se a sessão começa em 30 minutos
      if (timeDiffMinutes > 25 && timeDiffMinutes < 35) {
        // Buscar participantes da mesa
        const { data: participants, error: participantsError } = await supabase
          .from('table_participants')
          .select('user_id')
          .eq('table_id', table.id);
          
        if (participantsError) throw participantsError;
        
        // Criar notificações para cada participante
        for (const participant of participants || []) {
          notifications.push({
            user_id: participant.user_id,
            title: `Sessão em breve: ${table.name}`,
            content: `Sua sessão de RPG "${table.name}" começará em aproximadamente 30 minutos.`,
            type: 'session_update',
            reference_id: table.id,
            reference_type: 'table',
            read: false
          });
        }
      }
    }
    
    // Inserir notificações no banco de dados
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);
        
      if (notificationError) throw notificationError;
    }
    
    return new Response(JSON.stringify({
      success: true,
      notificationsCreated: notifications.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
