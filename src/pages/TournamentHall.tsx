import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import { toast } from '@/hooks/use-toast';

interface Game {
  id: number;
  tournament_id: number;
  round: number;
  table_number: number;
  white_player_id: number;
  white_player_name: string;
  black_player_id: number;
  black_player_name: string;
  status: 'waiting' | 'in_progress' | 'completed';
  result?: string;
  current_position?: string;
  white_time_remaining?: number;
  black_time_remaining?: number;
}

interface Tournament {
  id: number;
  name: string;
  status: string;
  current_round: number;
  total_rounds: number;
}

interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  isOnline?: boolean;
}

const TournamentHall = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'my_games' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (!tournamentId) {
      toast({
        title: "Ошибка",
        description: "ID турнира не указан",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    loadTournamentData();
    loadParticipants();
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/fb78feda-e1cb-4b60-a6c8-7bde514e8308`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const found = data.find((t: Tournament) => t.id === Number(tournamentId));
        if (found) {
          setTournament(found);
          setCurrentRound(found.current_round || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load tournament:', error);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/7ad7f893-7862-4ac9-b4a7-c9c4bf8cd97b?tournament_id=${tournamentId}`);
      const data = await response.json();
      
      if (data.participants) {
        const participantsWithStatus = data.participants.map((p: Participant) => ({
          ...p,
          isOnline: Math.random() > 0.5
        }));
        setParticipants(participantsWithStatus);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список участников",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'waiting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Идёт партия';
      case 'completed': return 'Завершена';
      case 'waiting': return 'Ожидание';
      default: return status;
    }
  };

  const onlineCount = participants.filter(p => p.isOnline).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="gap-2 mb-4"
          >
            <Icon name="ArrowLeft" size={20} />
            Назад к турнирам
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {tournament?.name || 'Турнирный зал'}
              </h1>
              <p className="text-gray-600">
                Тур {currentRound} из {tournament?.total_rounds || '?'}
              </p>
            </div>
            
            <Button variant="outline" className="gap-2">
              <Icon name="Trophy" size={18} />
              Турнирная таблица
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Участники турнира</h2>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-green-600">{onlineCount}</span> из {participants.length} в зале
                </span>
              </div>
            </div>
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Участники не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants.map((participant) => (
                <Card
                  key={participant.id}
                  className={`p-4 transition-all hover:shadow-md ${
                    participant.isOnline ? 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {participant.first_name?.charAt(0) || participant.last_name?.charAt(0) || '?'}
                      </div>
                      {participant.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {participant.first_name} {participant.last_name}
                      </div>
                      {participant.birth_date && (
                        <div className="text-xs text-gray-500">
                          {new Date().getFullYear() - new Date(participant.birth_date).getFullYear()} лет
                        </div>
                      )}
                      {participant.isOnline && (
                        <div className="flex items-center gap-1 mt-1">
                          <Icon name="Wifi" size={12} className="text-green-600" />
                          <span className="text-xs text-green-600 font-medium">В зале</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TournamentHall;