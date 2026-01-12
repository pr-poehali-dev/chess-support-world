import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Pusher from 'pusher-js';
import { PUSHER_CONFIG } from '@/config/pusher';

interface Pairing {
  id: number;
  board_number: number;
  white_player_name: string;
  black_player_name: string | null;
  result: string | null;
  game_id: string | null;
}

interface Props {
  tournamentId: number;
  roundNumber: number;
}

const CurrentRoundPairings = ({ tournamentId, roundNumber }: Props) => {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPairings();
  }, [tournamentId, roundNumber]);

  // Подписка на Pusher для обновления пар при новом туре
  useEffect(() => {
    const pusher = new Pusher(PUSHER_CONFIG.key, {
      cluster: PUSHER_CONFIG.cluster
    });

    const channel = pusher.subscribe(`tournament-${tournamentId}`);
    
    channel.bind('new-round', (data: any) => {
      console.log('[PUSHER] Новый тур - обновляю пары');
      loadPairings();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`tournament-${tournamentId}`);
      pusher.disconnect();
    };
  }, [tournamentId]);

  const loadPairings = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/0c199601-88dd-41ac-8753-0b3dd51d7515?tournament_id=${tournamentId}&round_number=${roundNumber}`
      );
      const data = await response.json();
      
      if (data.success && data.pairings) {
        console.log('🎯 Pairings data:', JSON.stringify(data.pairings, null, 2));
        setPairings(data.pairings);
      }
    } catch (error) {
      console.error('Failed to load pairings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (result: string | null) => {
    if (!result) return <Icon name="Clock" size={16} className="text-yellow-500" />;
    if (result === '1-0') return <span className="text-green-600">1-0</span>;
    if (result === '0-1') return <span className="text-red-600">0-1</span>;
    if (result === '1/2-1/2') return <span className="text-blue-600">½-½</span>;
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Users" size={24} />
            Пары тура {roundNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Icon name="Loader2" size={32} className="mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-gray-600">Загрузка пар...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Users" size={24} />
          Пары тура {roundNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pairings.map((pairing) => (
            <div
              key={pairing.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                  {pairing.board_number}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {pairing.white_player_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    vs
                  </div>
                  <div className="font-semibold text-gray-900">
                    {pairing.black_player_name || 'Выходной'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getResultIcon(pairing.result)}
                {pairing.game_id && !pairing.result && (
                  <Icon name="Swords" size={16} className="text-orange-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentRoundPairings;