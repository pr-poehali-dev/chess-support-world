import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Tournament {
  id: number;
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  location: string;
  max_participants: number | null;
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

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  registration_open: 'bg-green-100 text-green-700 border-green-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  finished: 'bg-red-100 text-red-700 border-red-300'
};

const TournamentsManager = () => {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    max_participants: '',
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
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
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
      end_date: tournament.end_date ? tournament.end_date.split('T')[0] : '',
      location: tournament.location || '',
      max_participants: tournament.max_participants?.toString() || '',
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
      end_date: '',
      location: '',
      max_participants: '',
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
          onClick={() => setShowForm(!showForm)}
          className="bg-chess-gold hover:bg-chess-gold/90 text-chess-dark gap-2"
        >
          <Icon name={showForm ? "X" : "Plus"} size={16} />
          {showForm ? 'Отмена' : 'Создать турнир'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-chess-gold/30">
          <h3 className="text-xl font-semibold mb-4 text-chess-dark">
            {editingId ? 'Редактировать турнир' : 'Новый турнир'}
          </h3>
          
          <div className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">Дата окончания</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Место проведения</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Город, адрес"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Макс. участников</label>
                <Input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="50"
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

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                className="bg-chess-gold hover:bg-chess-gold/90 text-chess-dark"
              >
                <Icon name="Save" size={16} className="mr-2" />
                {editingId ? 'Сохранить' : 'Создать'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
              >
                Отмена
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {tournaments.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Icon name="Trophy" size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Турниры еще не созданы</p>
          </Card>
        ) : (
          tournaments.map((tournament) => (
            <Card key={tournament.id} className="p-6 border-chess-gold/20 hover:border-chess-gold/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-chess-dark">{tournament.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[tournament.status]}`}>
                      {statusLabels[tournament.status]}
                    </span>
                  </div>

                  {tournament.description && (
                    <p className="text-gray-600 mb-3">{tournament.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {tournament.start_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Icon name="Calendar" size={14} />
                        <span>Начало: {new Date(tournament.start_date).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                    {tournament.end_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Icon name="CalendarCheck" size={14} />
                        <span>Конец: {new Date(tournament.end_date).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                    {tournament.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Icon name="MapPin" size={14} />
                        <span>{tournament.location}</span>
                      </div>
                    )}
                    {tournament.max_participants && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Icon name="Users" size={14} />
                        <span>До {tournament.max_participants} чел.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(tournament)}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Icon name="Edit" size={14} />
                  </Button>
                  <Button
                    onClick={() => handleDelete(tournament.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentsManager;
