import { supabase, safeDatabaseOp } from '../lib/supabase';
import { toast } from 'react-hot-toast';

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
    try {
      const queue = localStorage.getItem(SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      console.error('Error reading sync queue from localStorage:', e);
      return [];
    }
  },

  saveQueue(queue: SyncOperation[]) {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Error saving sync queue to localStorage:', e);
    }
  },

  addToQueue(table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
    const queue = this.getQueue();
    const operation: SyncOperation = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
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
    if (typeof navigator === 'undefined' || !navigator.onLine) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`Procesando cola de sincronización (${queue.length} operaciones)...`);
    const toastId = toast.loading(`Se detectó conexión a Internet. Sincronizando ${queue.length} registro(s) pendiente(s) guardado(s) offline...`, {
      position: 'bottom-right'
    });
    
    const remainingQueue: SyncOperation[] = [];

    for (const op of queue) {
      try {
        let error;
        if (op.type === 'INSERT') {
          const { error: insertError } = await safeDatabaseOp(
            op.table,
            'insert',
            op.data,
            (q) => q
          );
          error = insertError;
        } else if (op.type === 'UPDATE') {
          const { error: updateError } = await safeDatabaseOp(
            op.table,
            'update',
            op.data,
            (q) => q.match({ id: op.data.id })
          );
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
      toast.success('¡Sincronización automática exitosa! Todos los registros guardados localmente sin conexión se han subido de forma segura al servidor.', {
        id: toastId,
        duration: 6000
      });
    } else {
      console.log(`Sincronización parcial. Quedan ${remainingQueue.length} operaciones.`);
      toast.error(`Sincronización parcial. No se lograron respaldar ${remainingQueue.length} registro(s). Se intentará nuevamente al recuperar estabilidad.`, {
        id: toastId,
        duration: 5000
      });
    }
  },

  // Caching helpers
  setCache(key: string, data: any) {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving cache for ${key}:`, e);
    }
  },

  getCache(key: string) {
    try {
      const data = localStorage.getItem(`cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading cache for ${key}:`, e);
      return null;
    }
  }
};
