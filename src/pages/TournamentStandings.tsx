import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import { toast } from '@/hooks/use-toast';

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
  round_results: Record<number, string>;
}

interface Tournament {
  id: number;
  name: string;
  status: string;
}

const TournamentStandings = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [rounds, setRounds] = useState<number>(7);
  const [loading, setLoading] = useState(true);

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
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/fb78feda-e1cb-4b60-a6c8-7bde514e8308`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const found = data.find((t: Tournament) => t.id === Number(tournamentId));
        if (found) {
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
      if (data.rounds) {
        setRounds(data.rounds);
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

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) return 'Medal';
    return 'User';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate(`/tournament/${tournamentId}`)}
            variant="ghost"
            className="gap-2 mb-4"
          >
            <Icon name="ArrowLeft" size={20} />
            Назад к турнирному залу
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Турнирная таблица
              </h1>
              <p className="text-gray-600">
                {tournament?.name || 'Загрузка...'} • Туров: {rounds}
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Icon name="Loader2" size={48} className="mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-600">Загрузка турнирной таблицы...</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Турнирная таблица пуста</p>
              <p className="text-sm">Партии еще не сыграны</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 font-bold text-gray-700">#</th>
                    <th className="text-left p-4 font-bold text-gray-700">Участник</th>
                    <th className="text-center p-4 font-bold text-gray-700">Очки</th>
                    {Array.from({ length: rounds }, (_, i) => i + 1).map((round) => (
                      <th key={round} className="text-center p-3 font-bold text-gray-700 text-sm">
                        {round}
                      </th>
                    ))}
                    <th className="text-center p-4 font-bold text-gray-700">Партий</th>
                    <th className="text-center p-4 font-bold text-gray-700">+</th>
                    <th className="text-center p-4 font-bold text-gray-700">=</th>
                    <th className="text-center p-4 font-bold text-gray-700">-</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((player, index) => (
                    <tr
                      key={player.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-50 to-white' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Icon 
                            name={getMedalIcon(player.rank)} 
                            size={24} 
                            className={getMedalColor(player.rank)}
                          />
                          <span className="text-lg font-bold text-gray-900">{player.rank}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {player.first_name} {player.last_name}
                          </div>
                          {player.birth_date && (
                            <div className="text-xs text-gray-500">
                              {new Date().getFullYear() - new Date(player.birth_date).getFullYear()} лет
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                          {player.points}
                        </div>
                      </td>
                      {Array.from({ length: rounds }, (_, i) => i + 1).map((round) => (
                        <td key={round} className="p-2 text-center">
                          <span className="text-sm font-medium text-gray-600">
                            {player.round_results?.[round] || '-'}
                          </span>
                        </td>
                      ))}
                      <td className="p-4 text-center">
                        <span className="text-gray-700 font-medium">{player.games_played}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                          <Icon name="Check" size={16} />
                          {player.wins}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                          <Icon name="Minus" size={16} />
                          {player.draws}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                          <Icon name="X" size={16} />
                          {player.losses}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TournamentStandings;