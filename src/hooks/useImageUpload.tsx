
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseImageUploadOptions {
  bucketName: string;
  folderPath?: string;
  maxSizeInMB?: number;
  acceptedFileTypes?: string[];
}

export const useImageUpload = ({
  bucketName,
  folderPath = '',
  maxSizeInMB = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp']
}: UseImageUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  
  const convertToWebp = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Criar elemento de canvas para conversão
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Definir as dimensões do canvas
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Desenhar a imagem no canvas
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            
            // Converter para WebP
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Falha na conversão para WebP'));
                }
              }, 
              'image/webp',
              0.85 // Qualidade da compressão
            );
          } else {
            reject(new Error('Não foi possível criar o contexto do canvas'));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Erro ao carregar a imagem'));
        };
        
        // Carregar a imagem
        img.src = URL.createObjectURL(file);
      } catch (err) {
        reject(err);
      }
    });
  };
  
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      
      // Validar tipo de arquivo
      if (!acceptedFileTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não suportado. Aceitos: ${acceptedFileTypes.join(', ')}`);
      }
      
      // Validar tamanho
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`);
      }
      
      let fileToUpload: File | Blob = file;
      let fileExtension = 'webp';
      
      // Converter para WebP se não for já WebP
      if (file.type !== 'image/webp') {
        try {
          const webpBlob = await convertToWebp(file);
          fileToUpload = new File([webpBlob], `${file.name.split('.')[0]}.webp`, {
            type: 'image/webp'
          });
        } catch (conversionError) {
          console.error('Erro na conversão para WebP, enviando arquivo original', conversionError);
          fileToUpload = file;
          fileExtension = file.name.split('.').pop() || 'jpg';
        }
      }
      
      // Gerar nome de arquivo único
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
      
      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp'
          // Removed onUploadProgress as it's not supported in FileOptions
        });
      
      if (error) throw error;
      
      // Manual progress tracking for UI feedback
      setProgress(100);
      
      // Gerar URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro no upload: ${err.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  return {
    uploadImage,
    uploading,
    progress,
    error
  };
};
