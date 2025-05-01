
import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X } from 'lucide-react';

const MapCreation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEditing && user) {
      const fetchMapDetails = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('maps')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) {
          toast.error('Erro ao carregar detalhes do mapa');
          navigate('/maps');
        } else if (data) {
          setTitle(data.name);
          setDescription(data.description || '');
          setImageUrl(data.image_url || '');
          if (data.image_url) {
            setPreviewUrl(data.image_url);
          }
        }
        setIsLoading(false);
      };

      fetchMapDetails();
    }
  }, [id, isEditing, user, navigate]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous upload state
    setUploadProgress(0);
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Formato de arquivo não suportado. Use JPEG, PNG, GIF ou WEBP.');
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Clear the input value so the same file can be uploaded again if removed
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setImageUrl('');
  };

  const handleUploadImage = async () => {
    if (!imageFile || !user) return null;
    
    setIsUploading(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `maps/${user.id}/${fileName}`;

    try {
      // Create storage bucket if it doesn't exist
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('maps');

      if (bucketError && bucketError.message.includes('not found')) {
        await supabase.storage.createBucket('maps', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
      }

      const { error: uploadError, data } = await supabase.storage
        .from('maps')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('maps')
        .getPublicUrl(filePath);

      setImageUrl(publicUrlData.publicUrl);
      setIsUploading(false);
      return publicUrlData.publicUrl;
    } catch (error: any) {
      toast.error(`Erro ao fazer upload da imagem: ${error.message}`);
      setIsUploading(false);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar logado para criar um mapa');
      return;
    }

    if (!title || !description) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      // Upload image if a new file was selected
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await handleUploadImage() || imageUrl;
      }

      const mapData = {
        name: title,
        description,
        image_url: finalImageUrl,
        user_id: user.id
      };

      let result;
      if (isEditing) {
        result = await supabase
          .from('maps')
          .update(mapData)
          .eq('id', id)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('maps')
          .insert(mapData);
      }

      if (result.error) {
        throw result.error;
      }

      toast.success(`Mapa "${title}" ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/maps');
    } catch (error: any) {
      toast.error(`Erro ao ${isEditing ? 'editar' : 'criar'} mapa: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditing) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 text-center">
          <p className="text-fantasy-stone">Carregando detalhes do mapa...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-medievalsharp text-fantasy-gold mb-4">
          {isEditing ? 'Editar Mapa' : 'Criar Novo Mapa'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="block text-sm font-medium text-gray-200">
              Título do Mapa
            </Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 p-2 w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-200">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 p-2 w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="image" className="block text-sm font-medium text-gray-200 mb-2">
              Imagem do Mapa
            </Label>
            
            {previewUrl ? (
              <div className="relative mb-4">
                <img
                  src={previewUrl}
                  alt="Prévia do mapa"
                  className="w-full max-h-64 object-contain rounded-md border border-fantasy-purple/30"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-fantasy-dark/80 rounded-full p-1 text-red-400 hover:text-red-300"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-fantasy-purple/30 rounded-md p-6 text-center mb-4">
                <Upload className="mx-auto h-12 w-12 text-fantasy-stone" />
                <p className="mt-2 text-sm text-fantasy-stone">
                  Clique para selecionar ou arraste uma imagem aqui
                </p>
                <p className="text-xs text-fantasy-stone/70 mt-1">
                  PNG, JPG, GIF ou WEBP (máx. 5MB)
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                id="image"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              <Button
                type="button"
                onClick={() => document.getElementById('image')?.click()}
                className="secondary w-full"
                disabled={isUploading}
              >
                {previewUrl ? 'Trocar Imagem' : 'Selecionar Imagem'}
              </Button>
            </div>
            
            {imageUrl && !imageFile && (
              <p className="text-xs text-fantasy-stone mt-2">
                Imagem atual: {imageUrl.split('/').pop()}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading || isUploading} className="primary">
              {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Mapa' : 'Criar Mapa')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/maps')}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default MapCreation;
