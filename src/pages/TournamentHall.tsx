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

const TournamentHall = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<Game[]>([]);
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
    loadGames();
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

  const loadGames = async () => {
    const mockGames: Game[] = [
      {
        id: 1,
        tournament_id: Number(tournamentId),
        round: 1,
        table_number: 1,
        white_player_id: 1,
        white_player_name: "Иванов Иван",
        black_player_id: 2,
        black_player_name: "Петров Петр",
        status: 'in_progress',
        current_position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        white_time_remaining: 1800,
        black_time_remaining: 1750
      },
      {
        id: 2,
        tournament_id: Number(tournamentId),
        round: 1,
        table_number: 2,
        white_player_id: 3,
        white_player_name: "Сидоров Сергей",
        black_player_id: 4,
        black_player_name: "Козлов Алексей",
        status: 'completed',
        result: '1-0',
        current_position: 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'
      },
      {
        id: 3,
        tournament_id: Number(tournamentId),
        round: 1,
        table_number: 3,
        white_player_id: 5,
        white_player_name: "Морозов Дмитрий",
        black_player_id: 6,
        black_player_name: "Новиков Андрей",
        status: 'waiting',
      }
    ];
    
    setGames(mockGames);
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

  const filteredGames = games.filter(game => {
    if (game.round !== currentRound) return false;
    
    switch (filterStatus) {
      case 'my_games':
        return user && (game.white_player_id === user.id || game.black_player_id === user.id);
      case 'in_progress':
        return game.status === 'in_progress';
      case 'completed':
        return game.status === 'completed';
      default:
        return true;
    }
  });

  const isMyGame = (game: Game) => {
    return user && (game.white_player_id === user.id || game.black_player_id === user.id);
  };

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
            
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Icon name="Trophy" size={18} />
                Турнирная таблица
              </Button>
              <Button variant="outline" className="gap-2">
                <Icon name="Users" size={18} />
                Участники
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Партии тура</h2>
                
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    Все
                  </Button>
                  <Button
                    variant={filterStatus === 'my_games' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('my_games')}
                  >
                    Мои
                  </Button>
                  <Button
                    variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('in_progress')}
                  >
                    Идут
                  </Button>
                  <Button
                    variant={filterStatus === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('completed')}
                  >
                    Завершены
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredGames.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Icon name="CircleOff" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Партии не найдены</p>
                  </div>
                ) : (
                  filteredGames.map((game) => (
                    <Card
                      key={game.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedGame?.id === game.id ? 'ring-2 ring-blue-500' : ''
                      } ${isMyGame(game) ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedGame(game)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700">
                            {game.table_number}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {game.white_player_name}
                              </span>
                              <span className="text-sm text-gray-500">vs</span>
                              <span className="font-medium text-gray-900">
                                {game.black_player_name}
                              </span>
                            </div>
                            
                            {game.status === 'in_progress' && (
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Icon name="Clock" size={14} />
                                  <span>{formatTime(game.white_time_remaining)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Icon name="Clock" size={14} />
                                  <span>{formatTime(game.black_time_remaining)}</span>
                                </div>
                              </div>
                            )}
                            
                            {game.status === 'completed' && game.result && (
                              <div className="text-sm font-medium text-gray-600">
                                Результат: {game.result}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {isMyGame(game) && (
                            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              Моя партия
                            </div>
                          )}
                          
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(game.status)}`}>
                            {getStatusText(game.status)}
                          </div>
                          
                          <Icon name="ChevronRight" size={20} className="text-gray-400" />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-4">
              {selectedGame ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Стол {selectedGame.table_number}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedGame(null)}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center">
                      <div className="text-center">
                        <Icon name="Grid3x3" size={64} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Шахматная доска</p>
                        <p className="text-xs text-gray-500 mt-1">Будет добавлена на следующем этапе</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white border-2 border-gray-800 rounded"></div>
                          <span className="font-medium">{selectedGame.white_player_name}</span>
                        </div>
                        {selectedGame.white_time_remaining && (
                          <span className="text-sm font-mono">{formatTime(selectedGame.white_time_remaining)}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-800 text-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-800 border-2 border-white rounded"></div>
                          <span className="font-medium">{selectedGame.black_player_name}</span>
                        </div>
                        {selectedGame.black_time_remaining && (
                          <span className="text-sm font-mono">{formatTime(selectedGame.black_time_remaining)}</span>
                        )}
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg text-center font-medium border ${getStatusColor(selectedGame.status)}`}>
                      {getStatusText(selectedGame.status)}
                    </div>

                    {selectedGame.status === 'in_progress' && isMyGame(selectedGame) && (
                      <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                        <Icon name="Play" size={18} />
                        Открыть партию
                      </Button>
                    )}

                    {selectedGame.status === 'waiting' && isMyGame(selectedGame) && (
                      <Button className="w-full gap-2" disabled>
                        <Icon name="Clock" size={18} />
                        Ожидание начала
                      </Button>
                    )}

                    {selectedGame.status === 'completed' && (
                      <Button className="w-full gap-2" variant="outline">
                        <Icon name="Eye" size={18} />
                        Посмотреть партию
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon name="MousePointerClick" size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 font-medium mb-2">Выберите партию</p>
                  <p className="text-sm text-gray-500">Нажмите на партию слева, чтобы увидеть детали</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentHall;
