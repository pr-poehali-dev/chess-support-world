import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import TournamentParticipantsManager from '@/components/TournamentParticipantsManager';
import TournamentFormDialog from '@/components/tournaments-manager/TournamentFormDialog';
import TournamentCard from '@/components/tournaments-manager/TournamentCard';

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
    rounds: '7',
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
      rounds: formData.rounds ? parseInt(formData.rounds) : 7,
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
      rounds: tournament.rounds?.toString() || '7',
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
      rounds: '7',
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

      <TournamentFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />

      <div className="space-y-4">
        {tournaments.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Icon name="Trophy" size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Турниры еще не созданы</p>
          </Card>
        ) : (
          tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageParticipants={(t) => {
                setSelectedTournament(t);
                setShowParticipants(true);
              }}
            />
          ))
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
