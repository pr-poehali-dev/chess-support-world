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
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Icon name="Circle" size={16} className={topPlayerColor === 'white' ? "text-white stroke-gray-900" : "text-gray-900"} />
            <span className="font-semibold">{topPlayerName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <Chessboard
          position={position}
          onPieceDrop={onDrop}
          boardOrientation={playerColor === 'black' ? 'black' : 'white'}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Icon name="Circle" size={16} className={bottomPlayerColor === 'white' ? "text-white stroke-gray-900" : "text-gray-900"} />
            <span className="font-semibold">{bottomPlayerName}</span>
            {playerColor && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Вы</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center font-semibold text-lg mb-3">
          {gameStatus}
        </div>
        
        {playerColor && !gameStatus.includes('Мат') && !gameStatus.includes('Ничья') && (
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleOfferDraw}
              variant="outline"
              className="gap-2"
            >
              <Icon name="Handshake" size={16} />
              Предложить ничью
            </Button>
            <Button
              onClick={handleResign}
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              <Icon name="Flag" size={16} />
              Сдаться
            </Button>
          </div>
        )}
      </div>

      {moveHistory.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold mb-2">История ходов:</div>
          <div className="grid grid-cols-8 gap-1 text-xs">
            {moveHistory.map((move, index) => (
              <span key={index} className="bg-white px-2 py-1 rounded">
                {index + 1}. {move}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChessBoard;