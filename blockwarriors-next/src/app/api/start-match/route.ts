import { createSupabaseClient, getUser } from '@/auth/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  const supabase = await createSupabaseClient();
  const { selectedMode } = await req.json();

  if (!selectedMode) {
    return new Response(JSON.stringify({ error: 'Missing selected mode' }), { status: 400 });
  }

   
  const userId = (await getUser()).id;

  // Rewrite code below as SQL queries. 

  // Insert into matches table
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .insert([{ mode: selectedMode }])
    .select('match_id')
    .single();

  if (matchError) {
    console.log(matchError);
    return new Response(JSON.stringify({ error: 'Failed to create match' }), { status: 500 });
  }

  const matchId = matchData.match_id;
  let token;
  let tokenError;

  // Ensure unique token
  do {
    token = uuidv4();
    const { error } = await supabase
      .from('active_tokens')
      .insert([{ token, match_id: matchId }]);
    tokenError = error;
  } while (tokenError);
  console.log(`Match created with ID: ${matchId}`);
  console.log(`Token created: ${token}`);
  return new Response(JSON.stringify({ token, matchId }), { status: 200 });
}