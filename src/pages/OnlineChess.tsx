import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import SimpleChessboard from '@/components/SimpleChessboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const BACKEND_URLS = {
  gameCreate: 'https://functions.poehali.dev/25b46937-6efd-4eb4-893a-2898656e82f3',
  gameGet: 'https://functions.poehali.dev/7cdaaced-a780-4853-8559-0c013d6a3af2',
  gameMove: 'https://functions.poehali.dev/668c7b6f-f978-482a-a965-3f91c86ebea3'
};

export default function OnlineChess() {
  const { gameId } = useParams<{ gameId?: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [gameState, setGameState] = useState<any>(null);
  const [currentUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.id?.toString();
    }
    return null;
  });
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
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
        const gameData = data.game;
        setGameState(gameData);
        
        const newGame = new Chess(gameData.fen);
        setGame(newGame);
        
        if (currentUser) {
          if (parseInt(currentUser) === gameData.white_player_id) {
            setPlayerColor('white');
          } else if (parseInt(currentUser) === gameData.black_player_id) {
            setPlayerColor('black');
          } else if (!gameData.black_player_id && gameData.status === 'waiting') {
            setPlayerColor('black');
          }
        }
      }
    } catch (error) {
      console.error('Error loading game:', error);
    }
  };

  const createNewGame = async () => {
    if (!currentUser) {
      alert('Войдите в систему для создания игры');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(BACKEND_URLS.gameCreate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser
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

  const makeMove = (from: string, to: string) => {
    if (!gameState || !currentUser) return;

    const isPlayerTurn = 
      (playerColor === 'white' && gameState.current_turn === 'w') ||
      (playerColor === 'black' && gameState.current_turn === 'b');

    if (!isPlayerTurn) return;

    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from,
        to,
        promotion: 'q'
      });

      if (move === null) return;

      setGame(gameCopy);

      let status = 'active';
      let winner = null;

      if (gameCopy.isCheckmate()) {
        status = 'finished';
        winner = gameCopy.turn() === 'w' ? 'black' : 'white';
      } else if (gameCopy.isDraw() || gameCopy.isStalemate() || gameCopy.isThreefoldRepetition()) {
        status = 'draw';
      }

      fetch(BACKEND_URLS.gameMove, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser
        },
        body: JSON.stringify({
          game_id: gameId,
          fen: gameCopy.fen(),
          pgn: gameCopy.pgn(),
          current_turn: gameCopy.turn(),
          status,
          winner
        })
      });
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/online-chess/${gameId}`;
    navigator.clipboard.writeText(link);
    alert('Ссылка скопирована в буфер обмена!');
  };

  if (!gameId) {
    return (
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
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="p-6 flex justify-center">
            <SimpleChessboard
              position={game.fen()}
              onMove={makeMove}
              orientation={playerColor || 'white'}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация об игре</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gameState && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Статус</p>
                    <p className="font-medium">
                      {gameState.status === 'waiting' && 'Ожидание противника'}
                      {gameState.status === 'active' && 'Игра идёт'}
                      {gameState.status === 'finished' && `Победа: ${gameState.winner}`}
                      {gameState.status === 'draw' && 'Ничья'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Белые</p>
                    <p className="font-medium">{gameState.white_player_name || 'Игрок 1'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Чёрные</p>
                    <p className="font-medium">{gameState.black_player_name || 'Ожидание...'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Ваш цвет</p>
                    <p className="font-medium">
                      {playerColor === 'white' ? 'Белые' : playerColor === 'black' ? 'Чёрные' : 'Наблюдатель'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Ход</p>
                    <p className="font-medium">
                      {gameState.current_turn === 'w' ? 'Белые' : 'Чёрные'}
                    </p>
                  </div>

                  {gameState.status === 'waiting' && (
                    <Button onClick={copyInviteLink} variant="outline" className="w-full">
                      <Icon name="Copy" className="mr-2" size={16} />
                      Скопировать ссылку
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            <Icon name="Home" className="mr-2" size={16} />
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
}