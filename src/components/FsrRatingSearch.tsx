import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface PlayerData {
  fsr_id: string;
  name: string;
  rating_rapid?: number;
}

const FsrRatingSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [error, setError] = useState('');

  const searchPlayer = async () => {
    if (!searchQuery.trim()) {
      setError('Введите ID ФШР или фамилию игрока');
      return;
    }

    setLoading(true);
    setError('');
    setPlayerData(null);

    try {
      // Определяем, это ID или имя
      const isId = /^\d+$/.test(searchQuery.trim());
      const param = isId ? `fsr_id=${searchQuery.trim()}` : `name=${encodeURIComponent(searchQuery.trim())}`;
      
      const response = await fetch(
        `https://functions.poehali.dev/ac2aa89d-127b-4263-845d-4185d5db2ac2?${param}`
      );
      
      if (!response.ok) {
        throw new Error('Игрок не найден');
      }

      const data = await response.json();
      setPlayerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при поиске');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <Icon name="Trophy" size={24} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Рейтинг ФШР (Рапид)</h3>
          <p className="text-sm text-gray-600">Поиск по ID или фамилии</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="ID или фамилия (например: Непомнящий)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchPlayer()}
          className="flex-1"
        />
        <Button
          onClick={searchPlayer}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 gap-2"
        >
          {loading ? (
            <>
              <Icon name="Loader2" size={16} className="animate-spin" />
              Поиск...
            </>
          ) : (
            <>
              <Icon name="Search" size={16} />
              Найти
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <Icon name="AlertCircle" size={16} />
            {error}
          </p>
        </div>
      )}

      {playerData && (
        <div className="border-t pt-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="User" size={20} className="text-gray-600" />
            <h4 className="text-lg font-bold text-gray-900">{playerData.name}</h4>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium mb-2">Рейтинг Рапид</div>
            <div className="text-4xl font-bold text-purple-900">{playerData.rating_rapid || '—'}</div>
            <div className="text-xs text-purple-600 mt-2">ID ФШР: {playerData.fsr_id}</div>
          </div>

          <div className="pt-3 text-xs text-gray-500">
            <Icon name="Info" size={12} className="inline mr-1" />
            Данные обновляются каждые 30 минут с сайта ФШР
          </div>
        </div>
      )}

      {!playerData && !error && !loading && (
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-800 flex items-center gap-2">
            <Icon name="Info" size={16} />
            Введите ID ФШР или фамилию шахматиста для поиска актуального рейтинга
          </p>
        </div>
      )}
    </Card>
  );
};

export default FsrRatingSearch;
