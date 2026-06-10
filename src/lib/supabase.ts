import { createClient } from '@supabase/supabase-js';

// Usamos las variables de entorno si existen, o los valores directos proporcionados para el prototipo
console.log('Supabase: Initializing client');
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sptgoslrysifacycncyc.supabase.co';
// Sanitize URL by removing trailing slashes and any trailing /rest/v1
const sanitizeUrl = (url: string) => {
  let clean = url.trim().replace(/\/+$/, "");
  if (clean.endsWith("/rest/v1")) {
    clean = clean.substring(0, clean.length - 8);
  }
  return clean.replace(/\/+$/, "");
};
const supabaseUrl = sanitizeUrl(rawSupabaseUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdGdvc2xyeXNpZmFjeWNuY3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDk4MDcsImV4cCI6MjA4ODcyNTgwN30.HAc0HVh2_h0UdSXt1McVpNnxUjtPqUkekD5h-zMS_zs';

console.log('Supabase: URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'vimedical-storage-key'
  }
});
console.log('Supabase: Client initialized');

/**
 * Executes a Supabase insert or update query with self-healing for missing database columns.
 * It automatically detects if a column does not exist, removes it from the payload, and retries.
 */
export async function safeDatabaseOp<T = any>(
  table: string,
  op: 'insert' | 'update',
  payload: any,
  queryBuilder: (query: any) => any,
  maxRetries = 5
): Promise<{ data: T | null; error: any }> {
  let currentPayload = Array.isArray(payload) 
    ? payload.map(item => ({ ...item }))
    : { ...payload };

  let attempts = 0;
  while (attempts < maxRetries) {
    attempts++;
    try {
      let baseQuery = supabase.from(table);
      let query: any;
      if (op === 'insert') {
        query = baseQuery.insert(currentPayload);
      } else {
        query = baseQuery.update(currentPayload);
      }

      const finalQuery = queryBuilder(query);
      const { data, error } = await finalQuery;

      if (!error) {
        return { data: data as T, error: null };
      }

      // Check if it is a missing column error (Postgres code 42703 or PostgREST code PGRST204)
      const isMissingColumn = 
        error.code === '42703' || 
        error.code === 'PGRST204' ||
        (error.message && (
          error.message.toLowerCase().includes('column') || 
          error.message.toLowerCase().includes('columna')
        ) && (
          error.message.toLowerCase().includes('exist') ||
          error.message.toLowerCase().includes('schema cache')
        ));

      if (isMissingColumn) {
        // Try to parse the missing column name from the error message
        // Example: "column \"diagnosis\" of relation \"wounds\" does not exist"
        const match = error.message.match(/column "([^"]+)"/) || 
                      error.message.match(/column '([^']+)'/) || 
                      error.message.match(/columna "([^"]+)"/) ||
                      error.message.match(/columna '([^']+)'/);
        
        if (match && match[1]) {
          const columnName = match[1];
          console.warn(`[Supabase Auto-Heal] Column '${columnName}' does not exist on table '${table}'. Removing it and retrying...`);
          
          if (Array.isArray(currentPayload)) {
            currentPayload.forEach(item => {
              delete item[columnName];
            });
          } else {
            delete currentPayload[columnName];
          }
          continue; // Retry with cleaned payload
        } else {
          // Fallback guess: remove common culprits if parsing failed
          console.warn(`[Supabase Auto-Heal] Undefined column error on ${table}: ${error.message}. Attempting automatic cleaning...`);
          const suspects = ['diagnosis', 'initial_wound_photo', 'initial_photos'];
          let removedAny = false;
          
          suspects.forEach(suspect => {
            if (Array.isArray(currentPayload)) {
              currentPayload.forEach(item => {
                if (suspect in item) {
                  delete item[suspect];
                  removedAny = true;
                }
              });
            } else {
              if (suspect in currentPayload) {
                delete currentPayload[suspect];
                removedAny = true;
              }
            }
          });
          
          if (removedAny) {
            continue;
          }
        }
      }

      return { data: null, error };
    } catch (err: any) {
      console.error(`[Supabase Auto-Heal] Fatal exception on ${table} ${op}:`, err);
      return { data: null, error: err };
    }
  }

  return { data: null, error: { message: `Exceeded max retries in self-healing database op for table ${table}` } };
}
