import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import TournamentParticipantsManager from '@/components/TournamentParticipantsManager';

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
  status: 'draft' | 'registration_open' | 'in_progress' | 'finished';
  created_at: string;
  updated_at: string;
}

const statusLabels = {
  draft: 'Черновик',
  registration_open: 'Идет прием заявок',
  in_progress: 'Идет сейчас',
  finished: 'Окончен'
};

const statusConfig = {
  draft: {
    label: 'Черновик',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    card: 'border-l-4 border-l-gray-400 bg-gradient-to-r from-gray-50 to-white',
    icon: 'FileText',
    iconColor: 'text-gray-500'
  },
  registration_open: {
    label: 'Идет прием заявок',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-400',
    card: 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white shadow-emerald-100 shadow-md',
    icon: 'UserPlus',
    iconColor: 'text-emerald-600'
  },
  in_progress: {
    label: 'Идет сейчас',
    badge: 'bg-blue-100 text-blue-800 border-blue-400',
    card: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-blue-100 shadow-md',
    icon: 'Trophy',
    iconColor: 'text-blue-600'
  },
  finished: {
    label: 'Окончен',
    badge: 'bg-purple-100 text-purple-800 border-purple-400',
    card: 'border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 to-white',
    icon: 'Crown',
    iconColor: 'text-purple-600'
  }
};

const TournamentsManager = () => {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    location: '',
    max_participants: '',
    time_control: '',
    tournament_type: '' as 'blitz' | 'rapid' | '',
    entry_fee: '',
    status: 'draft' as Tournament['status']
  });

  const API_URL = 'https://functions.poehali.dev/fb78feda-e1cb-4b60-a6c8-7bde514e8308';

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to load tournaments');
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить турниры',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите название турнира',
        variant: 'destructive'
      });
      return;
    }

    const payload = {
      ...formData,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      entry_fee: formData.entry_fee ? parseFloat(formData.entry_fee) : 0,
      start_date: formData.start_date || null,
      start_time: formData.start_time || null,
      time_control: formData.time_control || null,
      tournament_type: formData.tournament_type || null
    };

    try {
      if (editingId) {
        const response = await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingId })
        });

        if (!response.ok) throw new Error('Failed to update tournament');

        toast({
          title: 'Успешно',
          description: 'Турнир обновлен'
        });
      } else {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to create tournament');

        toast({
          title: 'Успешно',
          description: 'Турнир создан'
        });
      }

      resetForm();
      loadTournaments();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить турнир',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (tournament: Tournament) => {
    setEditingId(tournament.id);
    setFormData({
      title: tournament.title,
      description: tournament.description || '',
      start_date: tournament.start_date ? tournament.start_date.split('T')[0] : '',
      start_time: tournament.start_time || '',
      location: tournament.location || '',
      max_participants: tournament.max_participants?.toString() || '',
      time_control: tournament.time_control || '',
      tournament_type: tournament.tournament_type || '',
      entry_fee: tournament.entry_fee?.toString() || '0',
      status: tournament.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот турнир?')) return;

    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete tournament');

      toast({
        title: 'Успешно',
        description: 'Турнир удален'
      });

      loadTournaments();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить турнир',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      start_time: '',
      location: '',
      max_participants: '',
      time_control: '',
      tournament_type: '',
      entry_fee: '',
      status: 'draft'
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-chess-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-chess-dark">Турниры</h2>
          <p className="text-gray-600 text-sm">Управление шахматными турнирами</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-chess-gold hover:bg-chess-gold/90 text-chess-dark gap-2"
        >
          <Icon name="Plus" size={16} />
          Создать турнир
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onClick={resetForm}
                variant="outline"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-chess-gold hover:bg-chess-gold/90 text-chess-dark"
              >
                <Icon name="Save" size={16} className="mr-2" />
                {editingId ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {tournaments.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Icon name="Trophy" size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Турниры еще не созданы</p>
          </Card>
        ) : (
          tournaments.map((tournament) => {
            const config = statusConfig[tournament.status];
            return (
              <Card key={tournament.id} className={`p-6 hover:shadow-lg transition-all ${config.card}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className={`p-3 rounded-xl bg-white shadow-sm ${config.iconColor}`}>
                      <Icon name={config.icon} size={28} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-chess-dark">{tournament.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${config.badge}`}>
                          {config.label}
                        </span>
                      </div>

                      {tournament.description && (
                        <p className="text-gray-700 mb-4 leading-relaxed">{tournament.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {tournament.start_date && (
                          <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                            <Icon name="Calendar" size={16} className="text-chess-gold" />
                            <span className="font-medium">
                              {new Date(tournament.start_date).toLocaleDateString('ru-RU')}
                              {tournament.start_time && ` в ${tournament.start_time.slice(0, 5)}`}
                            </span>
                          </div>
                        )}
                        {tournament.tournament_type && (
                          <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                            <Icon name="Zap" size={16} className="text-orange-500" />
                            <span className="font-medium">
                              {tournament.tournament_type === 'blitz' ? 'Блиц' : 'Рапид'}
                              {tournament.time_control && ` ${tournament.time_control}`}
                            </span>
                          </div>
                        )}

                        {tournament.max_participants && (
                          <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                            <Icon name="Users" size={16} className="text-blue-500" />
                            <span className="font-medium">До {tournament.max_participants} участников</span>
                          </div>
                        )}

                        {tournament.entry_fee !== null && tournament.entry_fee > 0 && (
                          <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                            <Icon name="Wallet" size={16} className="text-green-500" />
                            <span className="font-medium">Орг. взнос: {tournament.entry_fee} ₽</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setShowParticipants(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="border-green-400 text-green-700 hover:bg-green-50 hover:border-green-500"
                    >
                      <Icon name="Users" size={16} />
                    </Button>
                    <Button
                      onClick={() => handleEdit(tournament)}
                      variant="outline"
                      size="sm"
                      className="border-blue-400 text-blue-700 hover:bg-blue-50 hover:border-blue-500"
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(tournament.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-400 text-red-700 hover:bg-red-50 hover:border-red-500"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {selectedTournament && (
        <TournamentParticipantsManager
          open={showParticipants}
          onOpenChange={setShowParticipants}
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.title}
        />
      )}
    </div>
  );
};

export default TournamentsManager;