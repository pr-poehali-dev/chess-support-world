import { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import Pusher from 'pusher-js';
import { PUSHER_CONFIG } from '@/config/pusher';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChessBoardProps {
  gameId: string;
  userId: number;
  whitePlayerId: number;
  blackPlayerId: number;
  whitePlayerName: string;
  blackPlayerName: string;
  whitePlayerRating?: number | null;
  blackPlayerRating?: number | null;
  tournamentId?: number | null;
  onGameEnd?: (result: string) => void;
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

interface Tournament {
  id: number;
  title: string;
  status: string;
  rounds: number;
}

const formatTime = (seconds: number): string => {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const parseIncrement = (timeControl: string | null): number => {
  if (!timeControl) return 0;
  const parts = timeControl.split('+');
  if (parts.length < 2) return 0;
  return parseInt(parts[1], 10) || 0;
};

const ChessBoard = ({
  gameId,
  userId,
  tournamentId,
  whitePlayerId,
  blackPlayerId,
  whitePlayerName,
  blackPlayerName,
  whitePlayerRating,
  blackPlayerRating,
  onGameEnd
}: ChessBoardProps) => {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);

  // Контроль времени
  const [timeControl, setTimeControl] = useState<string | null>(null);
  const [whiteTime, setWhiteTime] = useState<number | null>(null);
  const [blackTime, setBlackTime] = useState<number | null>(null);
  const [currentTurnColor, setCurrentTurnColor] = useState<'w' | 'b'>('w');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isGameFinishedRef = useRef(false);
  const playerColorRef = useRef<'white' | 'black' | null>(null);
  const whiteTimeRef = useRef<number | null>(null);
  const blackTimeRef = useRef<number | null>(null);
  const timeControlRef = useRef<string | null>(null);
  const gameRef = useRef<Chess>(new Chess());

  // Синхронизируем ref с state
  useEffect(() => {
    isGameFinishedRef.current = isGameFinished;
  }, [isGameFinished]);

  useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);

  useEffect(() => {
    whiteTimeRef.current = whiteTime;
  }, [whiteTime]);

  useEffect(() => {
    blackTimeRef.current = blackTime;
  }, [blackTime]);

  useEffect(() => {
    timeControlRef.current = timeControl;
  }, [timeControl]);

  // Запуск/остановка таймера
  const startTimer = useCallback((turn: 'w' | 'b') => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (isGameFinishedRef.current) {
        clearInterval(timerRef.current!);
        return;
      }

      if (turn === 'w') {
        setWhiteTime(prev => {
          if (prev === null) return prev;
          const next = prev - 1;
          whiteTimeRef.current = next;
          if (next <= 0) {
            clearInterval(timerRef.current!);
            // Только сам белый игрок фиксирует истечение своего времени
            if (playerColorRef.current === 'white') {
              handleTimeout('white');
            }
            return 0;
          }
          return next;
        });
      } else {
        setBlackTime(prev => {
          if (prev === null) return prev;
          const next = prev - 1;
          blackTimeRef.current = next;
          if (next <= 0) {
            clearInterval(timerRef.current!);
            // Только сам чёрный игрок фиксирует истечение своего времени
            if (playerColorRef.current === 'black') {
              handleTimeout('black');
            }
            return 0;
          }
          return next;
        });
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (Number(userId) === Number(whitePlayerId)) {
      setPlayerColor('white');
    } else if (Number(userId) === Number(blackPlayerId)) {
      setPlayerColor('black');
    }

    loadGameState();

    const pusher = new Pusher(PUSHER_CONFIG.key, {
      cluster: PUSHER_CONFIG.cluster
    });

    const channel = pusher.subscribe(`game-${gameId}`);
    
    channel.bind('move', (data: {fen?: string; pgn?: string; current_turn?: string; status?: string; winner?: string; white_time?: number; black_time?: number}) => {
      console.log('[PUSHER] Получен ход:', data);
      
      if (data.status && ['checkmate', 'stalemate', 'draw', 'resignation', 'timeout'].includes(data.status)) {
        setIsGameFinished(true);
        stopTimer();
      }
      
      // Синхронизируем время только если это ход противника (не наш)
      // Наше время уже обновлено локально с инкрементом
      const isOpponentMove = data.current_turn !== undefined && (
        (playerColorRef.current === 'white' && data.current_turn === 'w') ||
        (playerColorRef.current === 'black' && data.current_turn === 'b') ||
        playerColorRef.current === null
      );
      if (isOpponentMove && data.white_time !== undefined && data.black_time !== undefined) {
        setWhiteTime(data.white_time);
        setBlackTime(data.black_time);
        whiteTimeRef.current = data.white_time;
        blackTimeRef.current = data.black_time;
      }

      if (data.fen && data.fen !== position) {
        const newGame = new Chess(data.fen);
        gameRef.current = newGame;
        setGame(newGame);
        setPosition(data.fen);
        setMoveHistory(newGame.history());
        updateGameStatus(newGame);

        if (data.current_turn && !data.status?.match(/checkmate|stalemate|draw|resignation|timeout/)) {
          const turn = data.current_turn as 'w' | 'b';
          setCurrentTurnColor(turn);
          startTimer(turn);
        }
      }
    });

    return () => {
      stopTimer();
      channel.unbind_all();
      pusher.unsubscribe(`game-${gameId}`);
      pusher.disconnect();
    };
  }, [gameId]);

  const loadGameState = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/7cdaaced-a780-4853-8559-0c013d6a3af2?game_id=${gameId}`
      );
      const data = await response.json();
      
      if (data.success && data.game) {
        const g = data.game;

        if (g.status && ['checkmate', 'stalemate', 'draw', 'resignation', 'timeout'].includes(g.status)) {
          setIsGameFinished(true);
        }
        
        if (g.fen) {
          const newGame = new Chess(g.fen);
          gameRef.current = newGame;
          setGame(newGame);
          setPosition(g.fen);
          setMoveHistory(newGame.history());
          updateGameStatus(newGame);
        }

        // Загружаем время из БД
        if (g.time_control) {
          setTimeControl(g.time_control);
        }
        if (g.white_time !== null && g.white_time !== undefined) {
          setWhiteTime(g.white_time);
          whiteTimeRef.current = g.white_time;
        }
        if (g.black_time !== null && g.black_time !== undefined) {
          setBlackTime(g.black_time);
          blackTimeRef.current = g.black_time;
        }

        // Запускаем таймер если игра активна
        if (g.status === 'active' && g.time_control && !isGameFinishedRef.current) {
          const turn = g.current_turn as 'w' | 'b';
          setCurrentTurnColor(turn);
          startTimer(turn);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load game state:', error);
      setLoading(false);
    }
  };

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === 'w' ? 'Черные' : 'Белые';
      setGameStatus(`Мат! Победили ${winner}`);
      setIsGameFinished(true);
      stopTimer();
      handleGameEnd(currentGame.turn() === 'w' ? 'black_win' : 'white_win');
    } else if (currentGame.isDraw()) {
      setGameStatus('Ничья');
      setIsGameFinished(true);
      stopTimer();
      handleGameEnd('draw');
    } else if (currentGame.isStalemate()) {
      setGameStatus('Пат - Ничья');
      setIsGameFinished(true);
      stopTimer();
      handleGameEnd('draw');
    } else if (currentGame.isCheck()) {
      setGameStatus('Шах!');
    } else {
      const turn = currentGame.turn() === 'w' ? 'Белые' : 'Черные';
      setGameStatus(`Ход: ${turn}`);
    }
  };

  // loserColor — тот, у кого закончилось время
  const handleTimeout = async (loserColor: 'white' | 'black') => {
    if (isGameFinishedRef.current) return;
    isGameFinishedRef.current = true;
    setIsGameFinished(true);
    stopTimer();

    const winnerColor = loserColor === 'white' ? 'black' : 'white';
    setGameStatus(`Время вышло! Победили ${winnerColor === 'white' ? 'Белые' : 'Черные'}`);

    toast({
      title: "Время вышло!",
      description: `Победили ${winnerColor === 'white' ? 'белые' : 'чёрные'}`,
    });

    try {
      const currentGame = gameRef.current;
      await fetch('https://functions.poehali.dev/668c7b6f-f978-482a-a965-3f91c86ebea3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify({
          game_id: gameId,
          fen: currentGame.fen(),
          pgn: currentGame.pgn(),
          current_turn: currentGame.turn(),
          status: 'timeout',
          winner: winnerColor,
          white_time: loserColor === 'white' ? 0 : (whiteTimeRef.current ?? 0),
          black_time: loserColor === 'black' ? 0 : (blackTimeRef.current ?? 0)
        })
      });
      if (onGameEnd) onGameEnd(winnerColor === 'white' ? 'white_win' : 'black_win');
    } catch (error) {
      console.error('Failed to report timeout:', error);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, result: formattedResult, winner })
      });
      
      if (onGameEnd) onGameEnd(result);
    } catch (error) {
      console.error('Failed to update game result:', error);
    }
  };

  const onDrop = async (sourceSquare: string, targetSquare: string) => {
    if (!playerColor) {
      toast({ title: "Ошибка", description: "Вы не участник этой партии", variant: "destructive" });
      return false;
    }

    const currentTurn = game.turn();
    const isMyTurn = (currentTurn === 'w' && playerColor === 'white') || 
                     (currentTurn === 'b' && playerColor === 'black');
    
    if (!isMyTurn) {
      toast({ title: "Не ваш ход", description: "Дождитесь своей очереди", variant: "destructive" });
      return false;
    }

    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (move === null) return false;

      const newFen = game.fen();
      const newPgn = game.pgn();
      const newTurn = game.turn() as 'w' | 'b';
      gameRef.current = game;
      
      setPosition(newFen);
      setMoveHistory(game.history());
      updateGameStatus(game);

      // Добавляем инкремент тому, кто только что ходил
      const increment = parseIncrement(timeControlRef.current);
      if (increment > 0) {
        const movedColor = newTurn === 'w' ? 'b' : 'w'; // кто только что ходил
        if (movedColor === 'w') {
          setWhiteTime(prev => {
            const v = (prev ?? 0) + increment;
            whiteTimeRef.current = v;
            return v;
          });
        } else {
          setBlackTime(prev => {
            const v = (prev ?? 0) + increment;
            blackTimeRef.current = v;
            return v;
          });
        }
      }

      // Переключаем таймер на противника
      if (!isGameFinishedRef.current) {
        setCurrentTurnColor(newTurn);
        startTimer(newTurn);
      }

      let status = 'active';
      let winner = null;
      
      if (game.isGameOver()) {
        stopTimer();
        if (game.isCheckmate()) {
          status = 'checkmate';
          winner = game.turn() === 'w' ? 'black' : 'white';
        } else if (game.isDraw()) {
          status = 'draw';
          winner = 'draw';
        } else if (game.isStalemate()) {
          status = 'stalemate';
          winner = 'draw';
        }
      }

      const body: Record<string, unknown> = {
        game_id: gameId,
        fen: newFen,
        pgn: newPgn,
        current_turn: newTurn,
        status,
        winner
      };

      // Передаём актуальное время (после хода время переключилось)
      if (whiteTimeRef.current !== null && blackTimeRef.current !== null) {
        body.white_time = whiteTimeRef.current;
        body.black_time = blackTimeRef.current;
      }

      await fetch('https://functions.poehali.dev/668c7b6f-f978-482a-a965-3f91c86ebea3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify(body)
      });

      return true;
    } catch (error) {
      console.error('Move failed:', error);
      return false;
    }
  };

  const handleResign = async () => {
    if (!playerColor) return;
    stopTimer();
    setIsGameFinished(true);
    const result = playerColor === 'white' ? 'black_win' : 'white_win';
    const winner = playerColor === 'white' ? 'black' : 'white';

    try {
      await fetch('https://functions.poehali.dev/668c7b6f-f978-482a-a965-3f91c86ebea3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify({
          game_id: gameId,
          fen: game.fen(),
          pgn: game.pgn(),
          current_turn: game.turn(),
          status: 'resignation',
          winner,
          white_time: whiteTimeRef.current ?? null,
          black_time: blackTimeRef.current ?? null
        })
      });
    } catch (error) {
      console.error('Resign failed:', error);
    }

    toast({ title: "Партия завершена", description: "Вы сдались" });
    if (onGameEnd) onGameEnd(result);
  };

  const loadTournamentStandings = async () => {
    if (!tournamentId) return;
    
    setLoadingStandings(true);
    try {
      const [tournamentRes, standingsRes] = await Promise.all([
        fetch('https://functions.poehali.dev/fb78feda-e1cb-4b60-a6c8-7bde514e8308'),
        fetch(`https://functions.poehali.dev/4f56b6da-5abe-49e0-96d2-b5134b60b9fa?tournament_id=${tournamentId}`)
      ]);

      const tournamentsData = await tournamentRes.json();
      const standingsData = await standingsRes.json();

      if (Array.isArray(tournamentsData)) {
        const found = tournamentsData.find((t: Tournament) => t.id === tournamentId);
        if (found) setTournament(found);
      }

      if (standingsData.standings) setStandings(standingsData.standings);
    } catch (error) {
      console.error('Failed to load tournament standings:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить турнирную таблицу", variant: "destructive" });
    } finally {
      setLoadingStandings(false);
    }
  };

  const handleOfferDraw = () => {
    toast({ title: "Предложение ничьей", description: "Функция в разработке" });
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

  // Время: верхний игрок — противник, нижний — текущий
  const topTime = topPlayerColor === 'white' ? whiteTime : blackTime;
  const bottomTime = bottomPlayerColor === 'white' ? whiteTime : blackTime;

  // Подсветка активного таймера
  const isTopActive = !isGameFinished && currentTurnColor === (topPlayerColor === 'white' ? 'w' : 'b');
  const isBottomActive = !isGameFinished && currentTurnColor === (bottomPlayerColor === 'white' ? 'w' : 'b');

  const isLowTime = (t: number | null) => t !== null && t <= 30;

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* Левая панель */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Info" size={18} className="text-blue-600" />
            <h3 className="font-bold text-base">Информация</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Белые</div>
              <div className="text-sm font-semibold">
                {whitePlayerName}
                {whitePlayerRating && <span className="text-gray-500"> ({whitePlayerRating})</span>}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 mb-1">Черные</div>
              <div className="text-sm font-semibold">
                {blackPlayerName}
                {blackPlayerRating && <span className="text-gray-500"> ({blackPlayerRating})</span>}
              </div>
            </div>
            
            {timeControl && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Контроль времени</div>
                <div className="text-sm font-semibold">{timeControl} мин</div>
              </div>
            )}
          </div>
        </Card>

        {tournamentId && (
          <Button 
            onClick={() => { setShowStandingsModal(true); loadTournamentStandings(); }}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Icon name="Trophy" size={20} className="mr-2" />
            Турнирная таблица
          </Button>
        )}

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
      <div className="flex-shrink-0">
        <Card className="p-4" style={{width: 'calc(600px + 20px)'}}>
          <div style={{width: '600px', margin: '0 auto'}}>
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
      <div className="w-full lg:flex-1 flex flex-col gap-3">
        {/* Верхний игрок + часы */}
        <div className={`p-3 rounded-lg border transition-all ${isTopActive ? 'bg-gray-800 border-gray-600' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${topPlayerColor === 'white' ? 'bg-white border-2 border-gray-300' : 'bg-gray-900'}`}>
                <Icon name="User" size={16} className={topPlayerColor === 'white' ? 'text-gray-900' : 'text-white'} />
              </div>
              <div>
                <div className={`font-semibold text-sm ${isTopActive ? 'text-white' : ''}`}>{topPlayerName}</div>
                <div className={`text-xs ${isTopActive ? 'text-gray-300' : 'text-gray-500'}`}>{topPlayerColor === 'white' ? 'Белые' : 'Черные'}</div>
              </div>
            </div>
            {topTime !== null ? (
              <div className={`text-right px-4 py-2 rounded-lg shadow-lg font-bold font-mono text-2xl tracking-wider transition-all
                ${isTopActive
                  ? isLowTime(topTime) ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-gray-900'
                  : 'bg-gray-900 text-white opacity-60'
                }`}>
                {formatTime(topTime)}
              </div>
            ) : (
              <div className="text-right bg-gray-900 px-4 py-2 rounded-lg shadow-lg">
                <div className="text-2xl font-bold font-mono text-white tracking-wider opacity-40">—</div>
              </div>
            )}
          </div>
        </div>

        {/* История ходов */}
        <Card className="p-4 flex flex-col" style={{height: '320px'}}>
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

        {/* Нижний игрок + часы */}
        <div className={`p-3 rounded-lg border-2 transition-all ${isBottomActive ? 'bg-blue-700 border-blue-500' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bottomPlayerColor === 'white' ? 'bg-white border-2 border-gray-300' : 'bg-gray-900'}`}>
                <Icon name="User" size={16} className={bottomPlayerColor === 'white' ? 'text-gray-900' : 'text-white'} />
              </div>
              <div>
                <div className={`flex items-center gap-2`}>
                  <span className={`font-semibold text-sm ${isBottomActive ? 'text-white' : ''}`}>{bottomPlayerName}</span>
                  {playerColor && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-semibold">ВЫ</span>}
                </div>
                <div className={`text-xs ${isBottomActive ? 'text-blue-200' : 'text-gray-500'}`}>{bottomPlayerColor === 'white' ? 'Белые' : 'Черные'}</div>
              </div>
            </div>
            {bottomTime !== null ? (
              <div className={`text-right px-4 py-2 rounded-lg shadow-lg font-bold font-mono text-2xl tracking-wider transition-all
                ${isBottomActive
                  ? isLowTime(bottomTime) ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-blue-700'
                  : 'bg-blue-600 text-white opacity-60'
                }`}>
                {formatTime(bottomTime)}
              </div>
            ) : (
              <div className="text-right bg-blue-600 px-4 py-2 rounded-lg shadow-lg">
                <div className="text-2xl font-bold font-mono text-white tracking-wider opacity-40">—</div>
              </div>
            )}
          </div>
        </div>

        {/* Статус и кнопки */}
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
          <div className="text-center font-bold text-base text-yellow-900 mb-2">
            {gameStatus}
          </div>
          
          {playerColor && !isGameFinished && (
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

          {tournamentId && isGameFinished && (
            <div className="mt-3">
              <Button 
                onClick={() => window.location.href = `/tournament/${tournamentId}`}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold"
              >
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                Вернуться в турнирный зал
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно с турнирной таблицей */}
      <Dialog open={showStandingsModal} onOpenChange={setShowStandingsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Турнирная таблица</DialogTitle>
          </DialogHeader>
          
          {loadingStandings ? (
            <div className="text-center py-12">
              <Icon name="Loader2" size={48} className="mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-600">Загрузка...</p>
            </div>
          ) : standings.length === 0 ? (
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
                    <tr key={player.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${player.rank <= 3 ? 'bg-yellow-50' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {player.rank <= 3 && (
                            <Icon name="Medal" size={18} className={player.rank === 1 ? 'text-yellow-500' : player.rank === 2 ? 'text-gray-400' : 'text-amber-600'} />
                          )}
                          <span className="font-semibold text-gray-900">{player.rank}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{player.first_name} {player.last_name}</div>
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
                      <td className="p-3 text-center text-gray-700">{player.games_played}</td>
                      <td className="p-3 text-center bg-green-50 text-green-700 font-semibold">{player.wins}</td>
                      <td className="p-3 text-center bg-gray-100 text-gray-700 font-semibold">{player.draws}</td>
                      <td className="p-3 text-center bg-red-50 text-red-700 font-semibold">{player.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChessBoard;