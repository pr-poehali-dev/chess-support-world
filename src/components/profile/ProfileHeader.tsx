import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ProfileHeaderProps {
  user: any;
  avatar: string | null;
  avatarFile: File | null;
  editing: boolean;
  loading: boolean;
  onEditClick: () => void;
  onSaveClick: () => void;
  onBackClick: () => void;
  onAvatarChange: (file: File | null) => void;
  onAvatarRemove: () => void;
}

export default function ProfileHeader({
  user,
  avatar,
  avatarFile,
  editing,
  loading,
  onEditClick,
  onSaveClick,
  onBackClick,
  onAvatarChange,
  onAvatarRemove
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          onClick={onBackClick}
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <Icon name="ArrowLeft" size={20} />
        </Button>
        <div className="relative group">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
            {avatar || avatarFile ? (
              <img 
                src={avatarFile ? URL.createObjectURL(avatarFile) : avatar!} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon name="User" size={40} className="text-blue-600" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
            <button
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Icon name="Camera" size={20} className="text-white" />
            </button>
            {(avatar || avatarFile) && (
              <button
                onClick={onAvatarRemove}
                className="p-2 bg-red-500/70 hover:bg-red-500/90 rounded-lg transition-colors"
              >
                <Icon name="Trash2" size={20} className="text-white" />
              </button>
            )}
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  toast({
                    title: "Файл слишком большой",
                    description: "Максимальный размер: 5 МБ",
                    variant: "destructive"
                  });
                  return;
                }
                onAvatarChange(file);
                toast({
                  title: "Фото выбрано",
                  description: "Сохраните изменения, чтобы обновить аватар"
                });
              }
            }}
            className="hidden"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="text-gray-600">Управление профилем</p>
        </div>
      </div>

      <div className="flex gap-2">
        {!editing && (
          <Button 
            onClick={onEditClick}
            className="gap-2"
          >
            <Icon name="Edit" size={18} />
            Редактировать
          </Button>
        )}
        {(editing || avatarFile) && (
          <Button 
            onClick={onSaveClick}
            disabled={loading}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Icon name="Loader2" className="animate-spin" size={18} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={18} />
                Сохранить
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
