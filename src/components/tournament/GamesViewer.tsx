import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

interface GamesViewerProps {
  games: any[];
}

const GamesViewer = ({ games }: GamesViewerProps) => {
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleGameSelect = (game: any) => {
    console.log('🎮 Selected game:', JSON.stringify(game, null, 2));
    setSelectedGame(game);
  };

  useEffect(() => {
    if (!selectedGame && games.length > 0) {
      setSelectedGame(games[0]);
    }
  }, [games, selectedGame]);

  useEffect(() => {
    if (selectedGame) {
      const updatedGame = games.find(g => g.id === selectedGame.id);
      if (updatedGame && updatedGame.fen !== selectedGame.fen) {
        console.log('🔄 Game position updated:', updatedGame.fen);
        setSelectedGame(updatedGame);
      }
    }
  }, [games, selectedGame]);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Icon name="Eye" size={24} />
        Просмотр партий
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4 h-[500px]">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Список партий</h3>
          <div className="space-y-2 flex-1 overflow-y-auto pr-2">
            {games.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="Gamepad2" size={40} className="mx-auto mb-2 opacity-50" />
                <p>Партии еще не сыграны</p>
              </div>
            ) : (
              games.map((game: any) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedGame?.id === game.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        Тур {game.round || '?'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {game.white_player_name || 'Неизвестно'} vs {game.black_player_name || 'Неизвестно'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Статус: {
                          game.status === 'waiting' || game.status === 'pending' ? 'Ожидает' : 
                          game.status === 'active' || game.status === 'in_progress' ? 'Идёт игра' : 
                          'Завершена'
                        }
                      </div>
                    </div>
                    {game.result && (
                      <div className="text-xs font-bold px-2 py-1 rounded bg-gray-100">
                        {game.result}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Детали партии</h3>
          {selectedGame ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4 h-full overflow-y-auto">
              <div>
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
                </div>
              </div>

              {selectedGame.fen && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Текущая позиция</div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="border border-gray-300 rounded-lg overflow-hidden hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <Chessboard 
                      position={selectedGame.fen}
                      boardWidth={280}
                      arePiecesDraggable={false}
                    />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 text-center text-gray-500 h-full flex flex-col items-center justify-center">
              <Icon name="MousePointerClick" size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Выберите партию для просмотра</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedGame && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Тур {selectedGame.round_number}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Icon name="X" size={24} />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-shrink-0">
                <Chessboard 
                  position={selectedGame.fen}
                  boardWidth={550}
                  arePiecesDraggable={false}
                />
              </div>

              <div className="space-y-4 flex-1 min-w-[250px]">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded border-2 border-gray-300"></div>
                    <div>
                      <div className="font-bold text-gray-900">{selectedGame.white_player_name}</div>
                      <div className="text-sm text-gray-600">Белые</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-900 rounded"></div>
                    <div>
                      <div className="font-bold text-gray-900">{selectedGame.black_player_name}</div>
                      <div className="text-sm text-gray-600">Черные</div>
                    </div>
                  </div>
                </div>

                {selectedGame.result && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Результат</div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedGame.result === 'white_win' ? 'Победа белых' : 
                       selectedGame.result === 'black_win' ? 'Победа черных' : 'Ничья'}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Статус</div>
                  <div className="font-semibold text-gray-900">
                    {selectedGame.status === 'waiting' || selectedGame.status === 'pending' ? 'Ожидает' : 
                     selectedGame.status === 'active' || selectedGame.status === 'in_progress' ? 'Идёт игра' : 
                     'Завершена'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">История ходов</div>
                  <div className="bg-white rounded border border-gray-200 p-3 max-h-64 overflow-y-auto">
                    {(() => {
                      if (!selectedGame.pgn) {
                        return (
                          <div className="text-center py-4 text-gray-400">
                            <Icon name="Clock" size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Ходы появятся здесь</p>
                          </div>
                        );
                      }

                      try {
                        const chess = new Chess();
                        chess.loadPgn(selectedGame.pgn);
                        const history = chess.history();

                        return (
                          <div className="space-y-1">
                            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, pairIndex) => {
                              const whiteMove = history[pairIndex * 2];
                              const blackMove = history[pairIndex * 2 + 1];
                              
                              return (
                                <div key={pairIndex} className="flex gap-2 p-1.5 rounded hover:bg-gray-50 transition-colors">
                                  <span className="font-bold text-gray-500 w-6 text-xs">{pairIndex + 1}.</span>
                                  <div className="flex gap-2 flex-1">
                                    <span className="font-mono text-xs font-semibold flex-1">{whiteMove}</span>
                                    {blackMove && <span className="font-mono text-xs font-semibold flex-1">{blackMove}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      } catch (error) {
                        return (
                          <div className="text-center py-4 text-gray-400">
                            <p className="text-xs">Нет данных о ходах</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GamesViewer;