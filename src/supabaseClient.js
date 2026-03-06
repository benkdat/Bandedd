import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrcgtkkaaapfmzzjvyphu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyY2d0a2thYXBmbXp6anZ5cGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTQwNTYsImV4cCI6MjA4ODM5MDA1Nn0.YilrzmLwST4A78UdwUj_FxCbOQ3W20soqVi-VwmyW7E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
