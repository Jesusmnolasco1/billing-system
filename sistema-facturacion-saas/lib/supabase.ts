import { createClient } from '@supabase/supabase-js';

// Traemos las llaves desde nuestro archivo secreto .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Creamos y exportamos la conexión oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey);