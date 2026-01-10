import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import PodiumCard from '@/components/tournament/PodiumCard';
import GamesViewer from '@/components/tournament/GamesViewer';
import StandingsTable from '@/components/tournament/StandingsTable';
import TournamentStats from '@/components/tournament/TournamentStats';
import CurrentRoundPairings from '@/components/tournament/CurrentRoundPairings';
import ChessBoard from '@/components/ChessBoard';
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

    const loadData = async () => {
      await loadTournamentData();
      await loadStandings();
    };
    
    loadData();
  }, [tournamentId]);

  useEffect(() => {
    if (standings.length > 0) {
      loadGames();
    }
  }, [standings]);

  useEffect(() => {
    if (!user || !tournamentId) return;

    const checkActiveGame = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch(
          `https://functions.poehali.dev/17abc2b2-3993-415b-bc53-681c566702b6?tournament_id=${tournamentId}`,
          {
            headers: {
              'X-User-Id': user.id.toString()
            }
          }
        );

        const data = await response.json();

        if (data.has_game && data.game_id) {
          navigate(`/game/${data.game_id}`);
        }
      } catch (error) {
        console.error('Failed to check active game:', error);
      }
    };

    checkActiveGame();
    const interval = setInterval(checkActiveGame, 5000);

    return () => clearInterval(interval);
  }, [user, tournamentId, navigate]);

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
      const response = await fetch(`https://functions.poehali.dev/4fdb7edf-b3b7-43b8-be98-d01e55edeb8e?tournament_id=${tournamentId}`);
      const data = await response.json();
      if (data.games) {
        const gamesWithNames = data.games.map((game: any) => {
          const whitePlayer = standings.find(s => s.id === game.white_player_id);
          const blackPlayer = standings.find(s => s.id === game.black_player_id);
          return {
            ...game,
            white_player_name: whitePlayer ? `${whitePlayer.last_name} ${whitePlayer.first_name}` : 'Неизвестно',
            black_player_name: blackPlayer ? `${blackPlayer.last_name} ${blackPlayer.first_name}` : 'Неизвестно',
            white_player_rating: whitePlayer?.rating,
            black_player_rating: blackPlayer?.rating
          };
        });
        setGames(gamesWithNames);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const startTournament = async () => {
    try {
      const drawResponse = await fetch('https://functions.poehali.dev/ecb405f1-c317-442d-af24-2f54c8ed0f13', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: Number(tournamentId) })
      });
      const drawData = await drawResponse.json();
      
      if (!drawData.success) {
        toast({
          title: "Ошибка",
          description: drawData.error || "Не удалось провести жеребьёвку",
          variant: "destructive"
        });
        return;
      }

      const startResponse = await fetch('https://functions.poehali.dev/21206049-7e6d-45f1-8e19-57aa762ef701', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tournament_id: Number(tournamentId),
          round_id: drawData.round_id
        })
      });
      const startData = await startResponse.json();
      
      if (startData.success) {
        toast({
          title: "Турнир стартовал!",
          description: `Тур 1 начался. Создано ${startData.total_games} партий.`,
        });
        loadGames();
        loadStandings();
        loadTournamentData();
      } else {
        toast({
          title: "Ошибка",
          description: startData.error || "Не удалось запустить тур",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось запустить турнир",
        variant: "destructive"
      });
    }
  };

  const top3 = standings.slice(0, 3);

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
              {user && (
                <Button onClick={startTournament} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Icon name="Play" size={20} />
                  Запустить турнир
                </Button>
              )}
              {tournament?.current_round && tournament.current_round > 0 && tournament.current_round < tournament.rounds && (
                <div className="px-4 py-2 bg-blue-50 rounded-lg">
                  <span className="font-semibold">Тур: {tournament.current_round}/{tournament.rounds}</span>
                </div>
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
                <PodiumCard top3={top3} />
              )}

              {user && tournament?.status === 'in_progress' && games.length > 0 && (() => {
                const userGame = games.find(g => 
                  (g.white_player_id === user.id || g.black_player_id === user.id) && 
                  g.status !== 'finished'
                );
                
                if (userGame) {
                  return (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Ваша партия</h2>
                      <ChessBoard
                        gameId={userGame.id}
                        userId={user.id}
                        whitePlayerId={userGame.white_player_id}
                        blackPlayerId={userGame.black_player_id}
                        whitePlayerName={userGame.white_player_name}
                        blackPlayerName={userGame.black_player_name}
                        whitePlayerRating={userGame.white_player_rating}
                        blackPlayerRating={userGame.black_player_rating}
                        onGameEnd={() => {
                          loadGames();
                          loadStandings();
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })()}

              {tournament?.current_round && tournament.current_round > 0 && (
                <div className="mb-6">
                  <CurrentRoundPairings 
                    tournamentId={Number(tournamentId)} 
                    roundNumber={tournament.current_round} 
                  />
                </div>
              )}

              <GamesViewer games={games} />

              <StandingsTable standings={standings} tournament={tournament} />
            </div>

            {tournament?.status === 'finished' && (
              <div className="lg:col-span-1">
                <TournamentStats standings={standings} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentHall;