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
    const gameId = '2f37d4bf-6c76-4f61-afb9-6851b8bc691b';
    
    setMessages(prev => [...prev, `🎮 Подключаюсь к тестовой игре ${gameId}...`]);
    
    try {
      // Подписываемся на события игры
      const gamePusher = new Pusher('6565e7fe3776add566a0', { cluster: 'eu' });
      const gameChannel = gamePusher.subscribe(`game-${gameId}`);
      
      setMessages(prev => [...prev, `🔌 Подписался на game-${gameId}`]);
      
      gameChannel.bind('move', (data: any) => {
        setMessages(prev => [...prev, `♟️ ПОЛУЧЕН ХОД ЧЕРЕЗ PUSHER!`]);
        setMessages(prev => [...prev, `📦 FEN: ${data.fen?.substring(0, 30)}...`]);
        setMessages(prev => [...prev, `✅ Этап 4 работает! Backend отправляет события.`]);
        gamePusher.disconnect();
      });
      
      const gameUrl = `${window.location.origin}/game/${gameId}`;
      setMessages(prev => [...prev, `📝 Открой игру в новой вкладке и сделай ход:`]);
      setMessages(prev => [...prev, `🔗 ${gameUrl}`]);
      
      // Добавляем кнопку для быстрого открытия
      setTimeout(() => {
        const btn = document.createElement('a');
        btn.href = gameUrl;
        btn.target = '_blank';
        btn.className = 'inline-block mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700';
        btn.textContent = '🎮 Открыть игру';
        document.getElementById('game-link-container')?.appendChild(btn);
      }, 100);
      
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
          <div id="game-link-container" className="mt-4"></div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Как проверить:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Дождись "✅ Pusher подключен"</li>
            <li><strong>Базовый тест:</strong> Нажми "Отправить тестовое событие" → должно прийти "📩 Получено: Pusher работает!"</li>
            <li><strong>Этап 4:</strong> Нажми "♟️ Тест хода в игре" → появится ссылка на игру</li>
            <li>Открой игру по ссылке в новой вкладке и сделай ход</li>
            <li>Вернись сюда — если появится "♟️ ПОЛУЧЕН ХОД ЧЕРЕЗ PUSHER!" — Этап 4 ✅</li>
          </ol>
        </div>
      </div>
    </div>
  );
}