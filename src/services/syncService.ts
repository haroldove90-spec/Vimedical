import { supabase, safeDatabaseOp } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface SyncOperation {
  id: string;
  table: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  createdAt: string;
  attempts?: number;
}

const SYNC_QUEUE_KEY = 'vimedical_sync_queue';
const SYNC_QUARANTINE_KEY = 'vimedical_sync_quarantine';

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
      attempts: 0,
    };
    queue.push(operation);
    this.saveQueue(queue);
    console.log(`Operación añadida a la cola de sincronización: ${type} en ${table}`);
  },

  getQuarantine(): any[] {
    try {
      const q = localStorage.getItem(SYNC_QUARANTINE_KEY);
      return q ? JSON.parse(q) : [];
    } catch (e) {
      return [];
    }
  },

  quarantineOperation(op: SyncOperation, error: any) {
    try {
      const q = this.getQuarantine();
      q.push({
        ...op,
        quarantinedAt: new Date().toISOString(),
        error: error?.message || error?.details || JSON.stringify(error) || 'Error de integridad'
      });
      localStorage.setItem(SYNC_QUARANTINE_KEY, JSON.stringify(q));
      console.warn(`[Sync Quarantine] Operación ${op.id} para tabla ${op.table} colocada en cuarentena tras múltiples intentos.`);
    } catch (e) {
      console.error('Error saving to quarantine:', e);
    }
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
      op.attempts = (op.attempts || 0) + 1;
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
          console.error(`Error sincronizando operación ${op.id} (Intento ${op.attempts}):`, error);
          if (op.attempts >= 3) {
            this.quarantineOperation(op, error);
          } else {
            remainingQueue.push(op);
          }
        } else {
          console.log(`Operación ${op.id} Sincronizada con éxito.`);
        }
      } catch (err) {
        console.error(`Error fatal sincronizando operación ${op.id}:`, err);
        if (op.attempts >= 3) {
          this.quarantineOperation(op, err);
        } else {
          remainingQueue.push(op);
        }
      }
    }

    this.saveQueue(remainingQueue);
    if (remainingQueue.length === 0) {
      console.log('Sincronización completada con éxito.');
      toast.success('¡Sincronización automática exitosa! Todos los registros guardados localmente sin conexión se han subido de forma segura al servidor.', {
        id: toastId,
        duration: 3500
      });
    } else {
      console.log(`Sincronización parcial. Quedan ${remainingQueue.length} operaciones.`);
      toast.error(`Sincronización en curso. Se detectaron ${remainingQueue.length} registro(s) temporalmente retenidos por el servidor, reintentando de fondo.`, {
        id: toastId,
        duration: 2500
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
