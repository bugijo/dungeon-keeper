
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiceRollRequest {
  formula: string;
  sessionId: string;
  userId: string;
  visibleToAll: boolean;
}

// Parse dice notation like "2d6+3"
function parseDiceNotation(notation: string) {
  // Handle common dice notations
  const regex = /^(\d+)?d(\d+)([+-]\d+)?$/i;
  const match = notation.trim().match(regex);
  
  if (!match) {
    throw new Error("Invalid dice notation. Format: [number]d[sides][+/-modifier]");
  }
  
  const numDice = match[1] ? parseInt(match[1]) : 1;
  const numSides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  if (numDice <= 0 || numDice > 100) {
    throw new Error("Number of dice must be between 1 and 100");
  }
  
  if (numSides <= 0 || numSides > 1000) {
    throw new Error("Number of sides must be between 1 and 1000");
  }
  
  return { numDice, numSides, modifier };
}

// Roll dice
function rollDice(numDice: number, numSides: number): number[] {
  const results = [];
  for (let i = 0; i < numDice; i++) {
    results.push(Math.floor(Math.random() * numSides) + 1);
  }
  return results;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Get the dice roll data from the request
    const data = await req.json() as DiceRollRequest;
    const { formula, sessionId, userId, visibleToAll } = data;
    
    if (!formula || !sessionId || !userId) {
      throw new Error("Missing required fields");
    }
    
    // Parse the dice formula
    const { numDice, numSides, modifier } = parseDiceNotation(formula);
    
    // Roll the dice
    const diceResults = rollDice(numDice, numSides);
    const total = diceResults.reduce((sum, val) => sum + val, 0) + modifier;
    
    // Format for display (e.g., "2d6+3")
    const displayFormula = `${numDice}d${numSides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ''}`;
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Store the result in the database
    const { data: rollData, error } = await supabase
      .from("dice_rolls")
      .insert({
        user_id: userId,
        session_id: sessionId,
        roll_formula: displayFormula,
        roll_result: total,
        roll_details: {
          dice: diceResults,
          modifier: modifier || undefined,
        },
        visible_to_all: visibleToAll,
      })
      .select("id")
      .single();
      
    if (error) {
      throw new Error(`Failed to store roll result: ${error.message}`);
    }
    
    return new Response(
      JSON.stringify({
        id: rollData?.id,
        formula: displayFormula,
        results: diceResults,
        modifier,
        total,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
