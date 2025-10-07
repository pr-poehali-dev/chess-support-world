import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import { toast } from '@/hooks/use-toast';

interface Tournament {
  id: number;
  title: string;
  name?: string;
  status: string;
  current_round?: number;
  rounds: number;
  total_rounds?: number;
}

interface Standing {
  rank: number;
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  games_played: number;
  round_results?: { [key: number]: string };
}

const TournamentHall = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any>(null);

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
    loadStandings();
    loadGames();
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/fb78feda-e1cb-4b60-a6c8-7bde514e8308`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const found = data.find((t: Tournament) => t.id === Number(tournamentId));
        if (found) {
          console.log('🏆 Tournament loaded:', found.title, 'Rounds:', found.rounds);
          setTournament(found);
        }
      }
    } catch (error) {
      console.error('Failed to load tournament:', error);
    }
  };

  const loadStandings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://functions.poehali.dev/4f56b6da-5abe-49e0-96d2-b5134b60b9fa?tournament_id=${tournamentId}`);
      const data = await response.json();
      
      if (data.standings) {
        setStandings(data.standings);
      }
    } catch (error) {
      console.error('Failed to load standings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить турнирную таблицу",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/d9c4d570-8eec-4b95-925d-c1f55ca52c7d?tournament_id=${tournamentId}`);
      const data = await response.json();
      if (data.games) {
        setGames(data.games);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const startNextRound = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/6b22bf6a-1a88-465b-bb7a-d1af71dc5940?tournament_id=${tournamentId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Успешно",
          description: `Тур ${data.round} создан! Пары сформированы.`,
        });
        loadGames();
        loadStandings();
        loadTournamentData();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось создать тур",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать тур",
        variant: "destructive"
      });
    }
  };

  const top3 = standings.slice(0, 3);
  const champion = top3[0];
  const second = top3[1];
  const third = top3[2];

  const totalGames = standings.reduce((sum, s) => sum + s.games_played, 0);
  const totalWhiteWins = standings.reduce((sum, s) => sum + s.wins, 0);
  const totalBlackWins = standings.reduce((sum, s) => sum + s.losses, 0);
  const totalDraws = standings.reduce((sum, s) => sum + s.draws, 0);

  const getStatusBadge = () => {
    if (!tournament) return null;
    
    const statusConfig = {
      draft: { label: 'Черновик', color: 'bg-gray-100 text-gray-700' },
      registration_open: { label: 'Регистрация открыта', color: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'Идёт сейчас', color: 'bg-green-100 text-green-700' },
      finished: { label: 'Турнир завершён', color: 'bg-purple-100 text-purple-700' }
    };

    const config = statusConfig[tournament.status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <div className={`px-4 py-2 rounded-lg font-semibold text-center ${config.color}`}>
        {config.label}
      </div>
    );
  };

  const renderResultCell = (result: string | number) => {
    if (result === 1) return <span className="text-green-600 font-bold">1</span>;
    if (result === 0) return <span className="text-red-600 font-bold">0</span>;
    if (result === 0.5) return <span className="text-orange-500 font-bold">½</span>;
    return <span className="text-gray-400">-</span>;
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
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {tournament?.title || tournament?.name || 'Загрузка...'}
            </h1>
            <div className="flex justify-center items-center gap-4">
              {getStatusBadge()}
              {tournament?.status === 'in_progress' && (
                <Button onClick={startNextRound} className="gap-2">
                  <Icon name="Shuffle" size={20} />
                  Запустить тур {(tournament?.current_round || 0) + 1}
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Icon name="Loader2" size={48} className="mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Загрузка результатов...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              {tournament?.status === 'finished' && top3.length >= 3 && (
                <Card className="p-8 mb-6">
                  <div className="flex items-end justify-center gap-6">
                    {second && (
                      <div className="flex flex-col items-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-3 shadow-lg">
                          <Icon name="Medal" size={64} className="text-white" />
                        </div>
                        <div className="bg-gray-100 px-6 py-8 rounded-t-xl text-center min-h-[120px] flex flex-col justify-center">
                          <div className="text-2xl font-bold text-gray-700 mb-1">2</div>
                          <div className="font-semibold text-gray-900 mb-1">
                            {second.first_name} {second.last_name}
                          </div>
                          <div className="text-sm text-gray-600">Очки: {second.points}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Перформанс: {Math.round(1800 + second.points * 50)}
                          </div>
                        </div>
                      </div>
                    )}

                    {champion && (
                      <div className="flex flex-col items-center -mt-4">
                        <div className="w-40 h-40 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mb-3 shadow-2xl">
                          <Icon name="Trophy" size={80} className="text-white" />
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 px-6 py-10 rounded-t-xl text-center min-h-[140px] flex flex-col justify-center border-2 border-yellow-400">
                          <div className="text-3xl font-bold text-yellow-700 mb-2">🏆 1</div>
                          <div className="font-bold text-gray-900 text-lg mb-1">
                            {champion.first_name} {champion.last_name}
                          </div>
                          <div className="text-base text-gray-700 font-semibold">Очки: {champion.points}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Перформанс: {Math.round(1800 + champion.points * 50)}
                          </div>
                        </div>
                      </div>
                    )}

                    {third && (
                      <div className="flex flex-col items-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center mb-3 shadow-lg">
                          <Icon name="Medal" size={64} className="text-white" />
                        </div>
                        <div className="bg-amber-50 px-6 py-8 rounded-t-xl text-center min-h-[120px] flex flex-col justify-center">
                          <div className="text-2xl font-bold text-amber-700 mb-1">3</div>
                          <div className="font-semibold text-gray-900 mb-1">
                            {third.first_name} {third.last_name}
                          </div>
                          <div className="text-sm text-gray-600">Очки: {third.points}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Перформанс: {Math.round(1800 + third.points * 50)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon name="Eye" size={24} />
                  Просмотр партий
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Список партий</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {games.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Icon name="Gamepad2" size={40} className="mx-auto mb-2 opacity-50" />
                          <p>Партии еще не сыграны</p>
                        </div>
                      ) : (
                        games.map((game: any) => (
                          <button
                            key={game.id}
                            onClick={() => setSelectedGame(game)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              selectedGame?.id === game.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm text-gray-900">
                                  Тур {game.round_number}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {game.white_player_name || 'Игрок 1'} vs {game.black_player_name || 'Игрок 2'}
                                </div>
                              </div>
                              {game.result && (
                                <div className="text-xs font-bold px-2 py-1 rounded bg-gray-100">
                                  {game.result === 'white_win' ? '1-0' : game.result === 'black_win' ? '0-1' : '½-½'}
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Детали партии</h3>
                    {selectedGame ? (
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="mb-4">
                          <div className="text-lg font-bold text-gray-900 mb-2">
                            Тур {selectedGame.round_number}
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Белые:</span>
                              <span className="font-medium">{selectedGame.white_player_name || 'Игрок 1'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Черные:</span>
                              <span className="font-medium">{selectedGame.black_player_name || 'Игрок 2'}</span>
                            </div>
                            {selectedGame.result && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Результат:</span>
                                <span className="font-bold">
                                  {selectedGame.result === 'white_win' ? 'Победа белых' : 
                                   selectedGame.result === 'black_win' ? 'Победа черных' : 'Ничья'}
                                </span>
                              </div>
                            )}
                            {selectedGame.pgn && (
                              <div className="mt-4">
                                <div className="text-gray-600 mb-1">PGN:</div>
                                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                  {selectedGame.pgn}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 text-center text-gray-500">
                        <Icon name="MousePointerClick" size={40} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Выберите партию для просмотра</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Турнирная таблица</h2>
                
                {standings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Нет результатов</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left p-3 font-bold text-gray-700">#</th>
                          <th className="text-left p-3 font-bold text-gray-700">Участник</th>
                          <th className="text-center p-3 font-bold text-gray-700">Очки</th>
                          {tournament?.rounds && Array.from({ length: tournament.rounds }, (_, i) => i + 1).map((round) => (
                            <th key={round} className="text-center p-2 font-bold text-gray-700 text-xs bg-blue-50">{round}</th>
                          ))}
                          <th className="text-center p-3 font-bold text-gray-700">Партий</th>
                          <th className="text-center p-3 font-bold text-gray-700 bg-green-50">+</th>
                          <th className="text-center p-3 font-bold text-gray-700 bg-gray-100">=</th>
                          <th className="text-center p-3 font-bold text-gray-700 bg-red-50">-</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((player) => (
                          <tr
                            key={player.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              player.rank <= 3 ? 'bg-yellow-50' : ''
                            }`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {player.rank <= 3 && (
                                  <Icon 
                                    name="Medal" 
                                    size={18} 
                                    className={
                                      player.rank === 1 ? 'text-yellow-500' :
                                      player.rank === 2 ? 'text-gray-400' :
                                      'text-amber-600'
                                    }
                                  />
                                )}
                                <span className="font-semibold text-gray-900">{player.rank}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-gray-900">
                                {player.first_name} {player.last_name}
                              </div>
                              {player.birth_date && (
                                <div className="text-xs text-gray-500">
                                  {new Date().getFullYear() - new Date(player.birth_date).getFullYear()} лет
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-bold text-lg text-blue-600">{player.points}</span>
                            </td>
                            {tournament?.rounds && Array.from({ length: tournament.rounds }, (_, i) => i + 1).map((round) => (
                              <td key={round} className="p-2 text-center bg-blue-50">
                                <span className="text-xs text-gray-600">{player.round_results?.[round] || '-'}</span>
                              </td>
                            ))}
                            <td className="p-3 text-center text-gray-700">
                              {player.games_played}
                            </td>
                            <td className="p-3 text-center bg-green-50 text-green-700 font-semibold">
                              {player.wins}
                            </td>
                            <td className="p-3 text-center bg-gray-100 text-gray-700 font-semibold">
                              {player.draws}
                            </td>
                            <td className="p-3 text-center bg-red-50 text-red-700 font-semibold">
                              {player.losses}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {tournament?.status === 'finished' && (
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Статистика турнира</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Средний рейтинг</span>
                    <span className="font-bold text-gray-900">
                      {standings.length > 0 ? Math.round(standings.reduce((sum, s) => sum + 1800, 0) / standings.length) : 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Сыграно партий</span>
                    <span className="font-bold text-gray-900">{Math.floor(totalGames / 2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Побед белыми</span>
                    <span className="font-bold text-gray-900">
                      {totalGames > 0 ? Math.round((totalWhiteWins / (totalGames / 2)) * 100) : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Побед чёрными</span>
                    <span className="font-bold text-gray-900">
                      {totalGames > 0 ? Math.round((totalBlackWins / (totalGames / 2)) * 100) : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Показатель ничьих</span>
                    <span className="font-bold text-gray-900">
                      {totalGames > 0 ? Math.round((totalDraws / (totalGames / 2)) * 100) : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Автопобеды</span>
                    <span className="font-bold text-gray-900">0%</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Отсутствие</span>
                    <span className="font-bold text-gray-900">0%</span>
                  </div>
                </div>
              </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentHall;