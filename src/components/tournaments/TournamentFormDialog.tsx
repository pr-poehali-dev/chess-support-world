import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface Tournament {
  id: number;
  title: string;
  description: string;
  start_date: string | null;
  start_time: string | null;
  location: string;
  max_participants: number | null;
  time_control: string | null;
  tournament_type: 'blitz' | 'rapid' | null;
  entry_fee: number | null;
  rounds: number | null;
  status: 'draft' | 'registration_open' | 'in_progress' | 'finished';
  created_at: string;
  updated_at: string;
}

interface FormData {
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  location: string;
  max_participants: string;
  time_control: string;
  tournament_type: 'blitz' | 'rapid' | '';
  entry_fee: string;
  rounds: string;
  status: Tournament['status'];
}

interface TournamentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: number | null;
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const TournamentFormDialog = ({
  open,
  onOpenChange,
  editingId,
  formData,
  setFormData,
  onSubmit,
  onCancel
}: TournamentFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-chess-dark">
            {editingId ? 'Редактировать турнир' : 'Новый турнир'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Название турнира"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание турнира"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Дата начала</label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Время начала</label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Тип турнира *</label>
              <select
                value={formData.tournament_type}
                onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value as 'blitz' | 'rapid' | '' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Выберите тип</option>
                <option value="blitz">Блиц</option>
                <option value="rapid">Рапид</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Контроль времени *</label>
              <select
                value={formData.time_control}
                onChange={(e) => setFormData({ ...formData, time_control: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Выберите контроль</option>
                <option value="3+2">3+2</option>
                <option value="5+3">5+3</option>
                <option value="10+0">10+0</option>
                <option value="10+5">10+5</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Макс. участников</label>
              <Input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Количество туров</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.rounds}
                onChange={(e) => setFormData({ ...formData, rounds: e.target.value })}
                placeholder="7"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Орг. взнос (₽)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Статус *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Tournament['status'] })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="draft">Черновик</option>
              <option value="registration_open">Идет прием заявок</option>
              <option value="in_progress">Идет сейчас</option>
              <option value="finished">Окончен</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={onCancel}
              variant="outline"
            >
              Отмена
            </Button>
            <Button
              onClick={onSubmit}
              className="bg-chess-gold hover:bg-chess-gold/90 text-chess-dark"
            >
              <Icon name="Save" size={16} className="mr-2" />
              {editingId ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentFormDialog;
