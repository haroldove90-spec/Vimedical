import { supabase } from '../lib/supabase';

export interface SyncOperation {
  id: string;
  table: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  createdAt: string;
}

const SYNC_QUEUE_KEY = 'vimedical_sync_queue';

export const syncService = {
  getQueue(): SyncOperation[] {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  },

  saveQueue(queue: SyncOperation[]) {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  },

  addToQueue(table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
    const queue = this.getQueue();
    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      table,
      type,
      data,
      createdAt: new Date().toISOString(),
    };
    queue.push(operation);
    this.saveQueue(queue);
    console.log(`Operación añadida a la cola de sincronización: ${type} en ${table}`);
  },

  async processQueue() {
    if (!navigator.onLine) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`Procesando cola de sincronización (${queue.length} operaciones)...`);
    
    const remainingQueue: SyncOperation[] = [];

    for (const op of queue) {
      try {
        let error;
        if (op.type === 'INSERT') {
          const { error: insertError } = await supabase.from(op.table).insert(op.data);
          error = insertError;
        } else if (op.type === 'UPDATE') {
          const { error: updateError } = await supabase.from(op.table).update(op.data).match({ id: op.data.id });
          error = updateError;
        }
        
        if (error) {
          console.error(`Error sincronizando operación ${op.id}:`, error);
          remainingQueue.push(op);
        } else {
          console.log(`Operación ${op.id} sincronizada con éxito.`);
        }
      } catch (err) {
        console.error(`Error fatal sincronizando operación ${op.id}:`, err);
        remainingQueue.push(op);
      }
    }

    this.saveQueue(remainingQueue);
    if (remainingQueue.length === 0) {
      console.log('Sincronización completada con éxito.');
    } else {
      console.log(`Sincronización parcial. Quedan ${remainingQueue.length} operaciones.`);
    }
  },

  // Caching helpers
  setCache(key: string, data: any) {
    localStorage.setItem(`cache_${key}`, JSON.stringify(data));
  },

  getCache(key: string) {
    const data = localStorage.getItem(`cache_${key}`);
    return data ? JSON.parse(data) : null;
  }
};
