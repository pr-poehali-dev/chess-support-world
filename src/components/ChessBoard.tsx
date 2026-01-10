import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ChessBoardProps {
  gameId: number;
  userId: number;
  whitePlayerId: number;
  blackPlayerId: number;
  whitePlayerName: string;
  blackPlayerName: string;
  onGameEnd?: (result: string) => void;
}

const ChessBoard = ({
  gameId,
  userId,
  whitePlayerId,
  blackPlayerId,
  whitePlayerName,
  blackPlayerName,
  onGameEnd
}: ChessBoardProps) => {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  useEffect(() => {
    console.log('🎨 Color determination:', {
      userId,
      whitePlayerId,
      blackPlayerId,
      userIdType: typeof userId,
      whitePlayerIdType: typeof whitePlayerId,
      blackPlayerIdType: typeof blackPlayerId,
      isWhite: Number(userId) === Number(whitePlayerId),
      isBlack: Number(userId) === Number(blackPlayerId)
    });
    
    if (Number(userId) === Number(whitePlayerId)) {
      setPlayerColor('white');
      console.log('✅ Set player color: WHITE');
    } else if (Number(userId) === Number(blackPlayerId)) {
      setPlayerColor('black');
      console.log('✅ Set player color: BLACK');
    } else {
      console.log('⚠️ User is not a player in this game');
    }

    loadGameState();
    
    const interval = setInterval(loadGameState, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  const loadGameState = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/e3e17c70-6cc9-4bb6-a55a-3335c5e9cb0f?game_id=${gameId}`
      );
      const data = await response.json();
      
      if (data.fen && data.fen !== position) {
        const newGame = new Chess(data.fen);
        setGame(newGame);
        setPosition(data.fen);
        setMoveHistory(newGame.history());
        updateGameStatus(newGame);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  };

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === 'w' ? 'Черные' : 'Белые';
      setGameStatus(`Мат! Победили ${winner}`);
      handleGameEnd(currentGame.turn() === 'w' ? 'black_win' : 'white_win');
    } else if (currentGame.isDraw()) {
      setGameStatus('Ничья');
      handleGameEnd('draw');
    } else if (currentGame.isStalemate()) {
      setGameStatus('Пат - Ничья');
      handleGameEnd('draw');
    } else if (currentGame.isCheck()) {
      setGameStatus('Шах!');
    } else {
      const turn = currentGame.turn() === 'w' ? 'Белые' : 'Черные';
      setGameStatus(`Ход: ${turn}`);
    }
  };

  const handleGameEnd = async (result: string) => {
    try {
      let formattedResult = '';
      let winner = null;
      
      if (result === 'white_win') {
        formattedResult = '1-0';
        winner = whitePlayerId;
      } else if (result === 'black_win') {
        formattedResult = '0-1';
        winner = blackPlayerId;
      } else if (result === 'draw') {
        formattedResult = '1/2-1/2';
        winner = null;
      }
      
      await fetch('https://functions.poehali.dev/e3e17c70-6cc9-4bb6-a55a-3335c5e9cb0f', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game_id: gameId,
          result: formattedResult,
          winner: winner
        })
      });
      
      if (onGameEnd) {
        onGameEnd(result);
      }
    } catch (error) {
      console.error('Failed to update game result:', error);
    }
  };

  const onDrop = async (sourceSquare: string, targetSquare: string) => {
    if (!playerColor) {
      toast({
        title: "Ошибка",
        description: "Вы не участник этой партии",
        variant: "destructive"
      });
      return false;
    }

    const currentTurn = game.turn();
    const isMyTurn = (currentTurn === 'w' && playerColor === 'white') || 
                     (currentTurn === 'b' && playerColor === 'black');
    
    if (!isMyTurn) {
      toast({
        title: "Не ваш ход",
        description: "Дождитесь своей очереди",
        variant: "destructive"
      });
      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move === null) return false;

      const newFen = game.fen();
      const newPgn = game.pgn();
      
      setPosition(newFen);
      setMoveHistory(game.history());
      updateGameStatus(game);

      await fetch('https://functions.poehali.dev/e3e17c70-6cc9-4bb6-a55a-3335c5e9cb0f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game_id: gameId,
          move: move.san,
          fen: newFen,
          pgn: newPgn
        })
      });

      return true;
    } catch (error) {
      console.error('Move failed:', error);
      return false;
    }
  };

  const handleResign = async () => {
    if (!playerColor) return;
    
    const result = playerColor === 'white' ? 'black_win' : 'white_win';
    await handleGameEnd(result);
    
    toast({
      title: "Партия завершена",
      description: "Вы сдались"
    });
  };

  const handleOfferDraw = () => {
    toast({
      title: "Предложение ничьей",
      description: "Функция в разработке",
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={32} className="animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  const topPlayerName = playerColor === 'black' ? whitePlayerName : blackPlayerName;
  const bottomPlayerName = playerColor === 'black' ? blackPlayerName : whitePlayerName;
  const topPlayerColor = playerColor === 'black' ? 'white' : 'black';
  const bottomPlayerColor = playerColor === 'black' ? 'black' : 'white';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Левая панель */}
      <div className="lg:col-span-1 flex flex-col gap-3">
        {/* Информация об игре */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Info" size={18} className="text-blue-600" />
            <h3 className="font-bold text-base">Информация</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Контроль времени</div>
              <div className="text-sm font-semibold">5 мин</div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Режим игры</div>
              <div className="text-sm font-semibold">Блиц</div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Статус</div>
              <div className="text-sm font-semibold text-green-600">Активна</div>
            </div>
          </div>
        </Card>

        {/* Чат */}
        <Card className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="MessageSquare" size={18} className="text-blue-600" />
            <h3 className="font-bold text-base">Чат</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-3 space-y-2 min-h-[200px]">
            <div className="text-center py-8 text-gray-400">
              <Icon name="MessagesSquare" size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Сообщений пока нет</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Напишите сообщение..."
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button size="sm" className="gap-1">
              <Icon name="Send" size={16} />
            </Button>
          </div>
        </Card>
      </div>

      {/* Шахматная доска */}
      <div className="lg:col-span-3">
        <Card className="p-4">
          <div className="max-w-xl mx-auto">
            <Chessboard
              position={position}
              onPieceDrop={onDrop}
              boardOrientation={playerColor === 'black' ? 'black' : 'white'}
              customBoardStyle={{
                borderRadius: '12px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)'
              }}
            />
          </div>
        </Card>
      </div>

      {/* Правая панель */}
      <div className="lg:col-span-1 flex flex-col gap-3">
        {/* Верхний игрок */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${topPlayerColor === 'white' ? 'bg-white border-2 border-gray-300' : 'bg-gray-900'}`}>
                <Icon name="User" size={16} className={topPlayerColor === 'white' ? 'text-gray-900' : 'text-white'} />
              </div>
              <div>
                <div className="font-semibold text-sm">{topPlayerName}</div>
                <div className="text-xs text-gray-500">{topPlayerColor === 'white' ? 'Белые' : 'Черные'}</div>
              </div>
            </div>
            <div className="text-right bg-gray-900 px-4 py-2 rounded-lg shadow-lg">
              <div className="text-2xl font-bold font-mono text-white tracking-wider">5:00</div>
            </div>
          </div>
        </div>

        {/* История ходов */}
        <Card className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="List" size={18} className="text-blue-600" />
            <h3 className="font-bold text-base">История ходов</h3>
          </div>
          
          {moveHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400 flex-1 flex flex-col items-center justify-center">
              <Icon name="Clock" size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Ходы появятся здесь</p>
            </div>
          ) : (
            <div className="space-y-1 overflow-y-auto flex-1">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, pairIndex) => {
                const whiteMove = moveHistory[pairIndex * 2];
                const blackMove = moveHistory[pairIndex * 2 + 1];
                
                return (
                  <div key={pairIndex} className="flex gap-2 p-1.5 rounded hover:bg-gray-50 transition-colors">
                    <span className="font-bold text-gray-500 w-6 text-sm">{pairIndex + 1}.</span>
                    <div className="flex gap-2 flex-1">
                      <span className="font-mono text-sm font-semibold flex-1">{whiteMove}</span>
                      {blackMove && <span className="font-mono text-sm font-semibold flex-1">{blackMove}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Нижний игрок */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border-2 border-blue-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bottomPlayerColor === 'white' ? 'bg-white border-2 border-gray-300' : 'bg-gray-900'}`}>
                <Icon name="User" size={16} className={bottomPlayerColor === 'white' ? 'text-gray-900' : 'text-white'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{bottomPlayerName}</span>
                  {playerColor && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-semibold">ВЫ</span>}
                </div>
                <div className="text-xs text-gray-500">{bottomPlayerColor === 'white' ? 'Белые' : 'Черные'}</div>
              </div>
            </div>
            <div className="text-right bg-blue-600 px-4 py-2 rounded-lg shadow-lg">
              <div className="text-2xl font-bold font-mono text-white tracking-wider">5:00</div>
            </div>
          </div>
        </div>

        {/* Статус и кнопки */}
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
          <div className="text-center font-bold text-base text-yellow-900 mb-2">
            {gameStatus}
          </div>
          
          {playerColor && !gameStatus.includes('Мат') && !gameStatus.includes('Ничья') && (
            <div className="flex gap-2 justify-center">
              <Button onClick={handleResign} variant="destructive" size="sm" className="gap-1">
                <Icon name="Flag" size={16} />
                Сдаться
              </Button>
              <Button onClick={handleOfferDraw} variant="outline" size="sm" className="gap-1">
                <Icon name="Handshake" size={16} />
                Предложить ничью
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;