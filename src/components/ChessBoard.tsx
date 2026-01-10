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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="p-6">
          {/* Верхний игрок */}
          <div className="mb-4 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${topPlayerColor === 'white' ? 'bg-white border-2 border-gray-300' : 'bg-gray-900'}`}>
                  <Icon name="User" size={20} className={topPlayerColor === 'white' ? 'text-gray-900' : 'text-white'} />
                </div>
                <div>
                  <div className="font-semibold text-lg">{topPlayerName}</div>
                  <div className="text-xs text-gray-500">{topPlayerColor === 'white' ? 'Белые' : 'Черные'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono">5:00</div>
                <div className="text-xs text-gray-500">Время</div>
              </div>
            </div>
          </div>

          {/* Шахматная доска */}
          <div className="max-w-2xl mx-auto">
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

          {/* Нижний игрок */}
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bottomPlayerColor === 'white' ? 'bg-white border-2 border-gray-300' : 'bg-gray-900'}`}>
                  <Icon name="User" size={20} className={bottomPlayerColor === 'white' ? 'text-gray-900' : 'text-white'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{bottomPlayerName}</span>
                    {playerColor && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-semibold">ВЫ</span>}
                  </div>
                  <div className="text-xs text-gray-500">{bottomPlayerColor === 'white' ? 'Белые' : 'Черные'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-blue-600">5:00</div>
                <div className="text-xs text-gray-500">Время</div>
              </div>
            </div>
          </div>

          {/* Статус игры */}
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
            <div className="text-center font-bold text-xl text-yellow-900 mb-3">
              {gameStatus}
            </div>
            
            {playerColor && !gameStatus.includes('Мат') && !gameStatus.includes('Ничья') && (
              <div className="flex gap-3 justify-center">
                <Button onClick={handleResign} variant="destructive" className="gap-2">
                  <Icon name="Flag" size={18} />
                  Сдаться
                </Button>
                <Button onClick={handleOfferDraw} variant="outline" className="gap-2">
                  <Icon name="Handshake" size={18} />
                  Предложить ничью
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* История ходов */}
      <div className="lg:col-span-1">
        <Card className="p-6 h-full">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="List" size={20} className="text-blue-600" />
            <h3 className="font-bold text-lg">История ходов</h3>
          </div>
          
          {moveHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Icon name="Clock" size={32} className="mx-auto mb-2 opacity-50" />
              <p>Ходы появятся здесь</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, pairIndex) => {
                const whiteMove = moveHistory[pairIndex * 2];
                const blackMove = moveHistory[pairIndex * 2 + 1];
                
                return (
                  <div key={pairIndex} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="font-bold text-gray-500 w-8">{pairIndex + 1}.</span>
                    <div className="flex gap-3 flex-1">
                      <span className="font-mono font-semibold flex-1">{whiteMove}</span>
                      {blackMove && <span className="font-mono font-semibold flex-1">{blackMove}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChessBoard;