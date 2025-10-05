import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const FsrRatingSearch = () => {
  const [fsrId, setFsrId] = useState('');
  const [error, setError] = useState('');

  const searchPlayer = () => {
    if (!fsrId.trim()) {
      setError('Введите ID ФШР');
      return;
    }

    // Открываем страницу поиска ФШР в новой вкладке
    const searchUrl = `https://ratings.ruchess.ru/people?q=${encodeURIComponent(fsrId.trim())}`;
    window.open(searchUrl, '_blank');
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
          className="bg-purple-600 hover:bg-purple-700 gap-2"
        >
          <Icon name="Search" size={16} />
          Найти
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <Icon name="AlertCircle" size={16} />
            {error}
          </p>
        </div>
      )}

      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-800 flex items-center gap-2">
          <Icon name="Info" size={16} />
          Нажмите "Найти" чтобы открыть страницу поиска ФШР с рейтингами игрока
        </p>
      </div>
    </Card>
  );
};

export default FsrRatingSearch;