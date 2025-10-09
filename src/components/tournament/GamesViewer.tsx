import { useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GamesViewerProps {
  games: any[];
}

const GamesViewer = ({ games }: GamesViewerProps) => {
  const [selectedGame, setSelectedGame] = useState<any>(null);

  return (
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
                        Тур {game.round || '?'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {game.white_player_name || 'Неизвестно'} vs {game.black_player_name || 'Неизвестно'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Статус: {game.status === 'pending' ? 'Ожидает' : game.status === 'in_progress' ? 'В процессе' : 'Завершена'}
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
  );
};

export default GamesViewer;
