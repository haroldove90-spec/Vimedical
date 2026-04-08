import { supabase } from '../lib/supabase';

export const storageService = {
  /**
   * Sube un archivo a un bucket de Supabase Storage
   * @param bucket Nombre del bucket ('photos', 'wounds', 'signatures')
   * @param path Ruta dentro del bucket (ej: 'profiles/user_id.png')
   * @param file Archivo a subir (File o Blob)
   */
  async uploadFile(bucket: string, path: string, file: File | Blob): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return null;
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
