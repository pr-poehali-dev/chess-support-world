import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export default function PusherTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const pusher = new Pusher('6565e7fe3776add566a0', {
      cluster: 'eu'
    });

    pusher.connection.bind('connected', () => {
      setConnected(true);
      setMessages(prev => [...prev, '✅ Pusher подключен!']);
    });

    pusher.connection.bind('error', (err: any) => {
      setMessages(prev => [...prev, `❌ Ошибка: ${err.message}`]);
    });

    const channel = pusher.subscribe('test-channel');

    channel.bind('test-event', (data: any) => {
      setMessages(prev => [...prev, `📩 Получено: ${data.message}`]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('test-channel');
      pusher.disconnect();
    };
  }, []);

  const triggerTest = async () => {
    setMessages(prev => [...prev, '🚀 Отправляю тестовое событие...']);
    
    try {
      const response = await fetch('https://functions.poehali.dev/bb5cdfc3-73c0-434d-816c-2b12d2ca5293');
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, '✅ Событие отправлено в Pusher']);
      } else {
        setMessages(prev => [...prev, `❌ Ошибка: ${data.error}`]);
      }
    } catch (error) {
      setMessages(prev => [...prev, `❌ Ошибка запроса: ${error}`]);
    }
  };

  const testGameMove = async () => {
    setMessages(prev => [...prev, '🎮 Создаю тестовую игру и делаю ход...']);
    
    try {
      const user = localStorage.getItem('user');
      if (!user) {
        setMessages(prev => [...prev, '❌ Нужно авторизоваться']);
        return;
      }
      
      const userId = JSON.parse(user).id;
      
      // Создаем тестовую игру
      const createResponse = await fetch('https://functions.poehali.dev/d8bbcf41-6f83-49d6-aa17-3e9d81bfd98f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          time_control: 600,
          increment: 5
        })
      });
      
      const createData = await createResponse.json();
      
      if (!createData.game_id) {
        setMessages(prev => [...prev, `❌ Ошибка создания игры: ${JSON.stringify(createData)}`]);
        return;
      }
      
      const gameId = createData.game_id;
      setMessages(prev => [...prev, `✅ Игра создана: ${gameId}`]);
      
      // Подписываемся на события игры
      const gamePusher = new Pusher('6565e7fe3776add566a0', { cluster: 'eu' });
      const gameChannel = gamePusher.subscribe(`game-${gameId}`);
      
      gameChannel.bind('move', (data: any) => {
        setMessages(prev => [...prev, `♟️ Получен ход через Pusher! FEN: ${data.fen.substring(0, 20)}...`]);
        gamePusher.disconnect();
      });
      
      // Делаем тестовый ход (e2-e4)
      setTimeout(async () => {
        const moveResponse = await fetch('https://functions.poehali.dev/668c7b6f-f978-482a-a965-3f91c86ebea3', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId.toString()
          },
          body: JSON.stringify({
            game_id: gameId,
            fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
            pgn: 'e2e4',
            current_turn: 'b',
            status: 'active'
          })
        });
        
        const moveData = await moveResponse.json();
        setMessages(prev => [...prev, `✅ Ход отправлен: ${moveData.success ? 'успешно' : 'ошибка'}`]);
      }, 1000);
      
    } catch (error) {
      setMessages(prev => [...prev, `❌ Ошибка: ${error}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Тест Pusher WebSocket</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">
              {connected ? 'Подключено' : 'Отключено'}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={triggerTest}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Отправить тестовое событие
            </button>
            
            <button
              onClick={testGameMove}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              ♟️ Тест хода в игре
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Лог событий:</h2>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-gray-500">Событий пока нет...</p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Как проверить:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Дождись "✅ Pusher подключен"</li>
            <li><strong>Базовый тест:</strong> Нажми "Отправить тестовое событие" → должно прийти "📩 Получено: Pusher работает!"</li>
            <li><strong>Этап 4:</strong> Нажми "♟️ Тест хода в игре" → должно появиться "♟️ Получен ход через Pusher!"</li>
            <li>Если оба теста ✅ — game-move успешно отправляет события в Pusher</li>
          </ol>
        </div>
      </div>
    </div>
  );
}