import { supabase } from '../lib/supabase';

// Helper to convert a File or Blob to a Base64 data URL
const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const storageService = {
  /**
   * Sube un archivo a un bucket de Supabase Storage
   * @param bucket Nombre del bucket ('photos', 'wounds', 'signatures')
   * @param path Ruta dentro del bucket (ej: 'profiles/user_id.png')
   * @param file Archivo a subir (File o Blob)
   */
  async uploadFile(bucket: string, path: string, file: File | Blob): Promise<string | null> {
    console.log(`Iniciando subida a ${bucket}/${path}...`);
    
    // Timer para debugging de lentitud
    const startTime = Date.now();
    
    try {
      // Implementamos un timeout manual de 30 segundos
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en la subida a Supabase Storage')), 30000)
      );

      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'image/png',
          cacheControl: '3600'
        });

      let response: any;
      try {
        response = await Promise.race([uploadPromise as any, timeoutPromise]);
      } catch (raceErr: any) {
        console.warn('La promesa de subida falló o expiró (activando fallback):', raceErr);
        response = { error: raceErr, data: null };
      }

      let { data, error } = response || { error: new Error('Respuesta inválida de Supabase'), data: null };

      // Si el error indica que el bucket no existe, intentamos crearlo de manera proactiva
      if (error && (
        error.message?.toLowerCase().includes('not found') || 
        error.message?.toLowerCase().includes('bucket') ||
        error.status === 404 ||
        error.status === 400
      )) {
        console.log(`Bucket '${bucket}' no encontrado o inaccesible (Error: ${error.message}). Intentando crearlo de forma proactiva...`);
        try {
          // Intentamos crear el bucket como público
          const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: true,
          });

          if (!createError) {
            console.log(`Bucket '${bucket}' creado exitosamente. Reintentando subida...`);
            const retryUpload = await supabase.storage
              .from(bucket)
              .upload(path, file, {
                upsert: true,
                contentType: file.type || 'image/png',
                cacheControl: '3600'
              });
            data = retryUpload.data;
            error = retryUpload.error;
          } else {
            console.warn(`Error de Supabase al crear el bucket '${bucket}':`, createError);
          }
        } catch (bucketErr) {
          console.warn(`Excepción intentando crear el bucket '${bucket}':`, bucketErr);
        }
      }

      if (error) {
        console.warn(`Error de Supabase Storage en ${bucket} (se usará fallback Base64):`, error.message || error);
        throw error;
      }

      if (!data) throw new Error('No se recibieron datos de la subida');

      console.log(`Subida exitosa a ${bucket}/${path} en ${Date.now() - startTime}ms. Obteniendo URL pública...`);
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log(`URL pública obtenida: ${publicUrl}`);
      return publicUrl;
    } catch (error: any) {
      console.warn(`[Supabase Storage] Fallback activado de forma transparente para '${bucket}/${path}'`);
      console.log(`Convirtiendo archivo a Base64 local para evitar fallas en la experiencia del usuario...`);
      try {
        const base64Url = await fileToBase64(file);
        console.log('Archivo convertido a Base64 exitosamente para persistencia directa.');
        return base64Url;
      } catch (fallbackError) {
        console.warn('Error al generar fallback de Base64:', fallbackError);
        return null;
      }
    }
  },

  /**
   * Convierte una cadena Base64 a un Blob para subirlo
   */
  base64ToBlob(base64: string): Blob {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  },

  /**
   * Sube una imagen Base64 (ej: de un canvas o FileReader)
   */
  async uploadBase64(bucket: string, path: string, base64: string): Promise<string | null> {
    const blob = this.base64ToBlob(base64);
    return this.uploadFile(bucket, path, blob);
  }
};
