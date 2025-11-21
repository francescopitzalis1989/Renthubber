
import { createClient } from "@supabase/supabase-js";

// Credenziali fornite
const SUPABASE_URL = "https://upyznglekmynztmydtxi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_azKizC14Kzw7jWT7cFunSg_X_afAvg0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
