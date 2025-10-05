import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface PlayerData {
  fsr_id: string;
  name: string;
  fide_id?: string;
  rating_rapid?: number;
  rating_blitz?: number;
  rating_classic?: number;
  birth_year?: number;
  region?: string;
}

const FsrRatingSearch = () => {
  const [fsrId, setFsrId] = useState('');
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [error, setError] = useState('');

  const searchPlayer = async () => {
    if (!fsrId.trim()) {
      setError('Введите ID ФШР');
      return;
    }

    setLoading(true);
    setError('');
    setPlayerData(null);

    try {
      const response = await fetch(
        `https://functions.poehali.dev/ac2aa89d-127b-4263-845d-4185d5db2ac2?fsr_id=${fsrId.trim()}`
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
          <Icon name="Search" size={24} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Поиск рейтинга ФШР</h3>
          <p className="text-sm text-gray-600">Введите ID игрока для поиска</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="ID ФШР (например: 430453)"
          value={fsrId}
          onChange={(e) => setFsrId(e.target.value)}
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

          <div className="grid grid-cols-2 gap-3">
            {playerData.rating_classic && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Классика</div>
                <div className="text-2xl font-bold text-blue-900">{playerData.rating_classic}</div>
              </div>
            )}

            {playerData.rating_rapid && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-600 font-medium mb-1">Рапид</div>
                <div className="text-2xl font-bold text-green-900">{playerData.rating_rapid}</div>
              </div>
            )}

            {playerData.rating_blitz && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-xs text-yellow-600 font-medium mb-1">Блиц</div>
                <div className="text-2xl font-bold text-yellow-900">{playerData.rating_blitz}</div>
              </div>
            )}

            {playerData.fide_id && (
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-purple-600 font-medium mb-1">ФИДЕ ID</div>
                <div className="text-lg font-bold text-purple-900">{playerData.fide_id}</div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t">
            <a
              href={`https://ratings.ruchess.ru/people/${playerData.fsr_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              Открыть профиль на сайте ФШР
              <Icon name="ExternalLink" size={14} />
            </a>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FsrRatingSearch;
