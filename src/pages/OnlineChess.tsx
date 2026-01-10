import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ChessBoard from '@/components/ChessBoard';
import Header from '@/components/Header';

const BACKEND_URLS = {
  gameCreate: 'https://functions.poehali.dev/25b46937-6efd-4eb4-893a-2898656e82f3',
  gameGet: 'https://functions.poehali.dev/7cdaaced-a780-4853-8559-0c013d6a3af2',
  gameMove: 'https://functions.poehali.dev/668c7b6f-f978-482a-a965-3f91c86ebea3'
};

export default function OnlineChess() {
  const { gameId } = useParams<{ gameId?: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<any>(null);
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadGame();
      const interval = setInterval(loadGame, 2000);
      return () => clearInterval(interval);
    }
  }, [gameId]);

  const loadGame = async () => {
    try {
      const response = await fetch(`${BACKEND_URLS.gameGet}?game_id=${gameId}`);
      const data = await response.json();
      
      if (data.success) {
        setGameState(data.game);
      }
    } catch (error) {
      console.error('Error loading game:', error);
    }
  };

  const createNewGame = async () => {
    if (!user) {
      alert('Войдите в систему для создания игры');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(BACKEND_URLS.gameCreate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        }
      });

      const data = await response.json();
      
      if (data.success) {
        navigate(`/online-chess/${data.game_id}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!gameId) {
    return (
      <>
        <Header user={user} />
        <div className="container mx-auto p-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-3xl">Онлайн-шахматы</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <p className="text-center text-muted-foreground">
                Создайте новую игру и поделитесь ссылкой с другом, чтобы сыграть онлайн
              </p>
              <Button onClick={createNewGame} disabled={isLoading} size="lg">
                <Icon name="Plus" className="mr-2" size={20} />
                {isLoading ? 'Создание...' : 'Создать новую игру'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!gameState) {
    return (
      <>
        <Header user={user} />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <Icon name="Loader2" size={48} className="mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Загрузка партии...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={() => navigate('/')} variant="ghost" className="gap-2">
            <Icon name="ArrowLeft" size={20} />
            На главную
          </Button>
        </div>

        <ChessBoard
          gameId={parseInt(gameId)}
          userId={user?.id || 0}
          whitePlayerId={gameState.white_player_id}
          blackPlayerId={gameState.black_player_id}
          whitePlayerName={gameState.white_player_name || 'Игрок 1'}
          blackPlayerName={gameState.black_player_name || 'Игрок 2'}
          onGameEnd={() => {
            loadGame();
          }}
        />
      </div>
    </>
  );
}