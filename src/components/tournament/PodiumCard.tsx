import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

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

interface PodiumCardProps {
  top3: Standing[];
}

const PodiumCard = ({ top3 }: PodiumCardProps) => {
  if (top3.length < 3) return null;

  const champion = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <Card className="p-8 mb-6">
      <div className="flex items-end justify-center gap-6">
        {second && (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-3 shadow-lg">
              <Icon name="Medal" size={64} className="text-white" />
            </div>
            <div className="bg-gray-100 px-6 py-8 rounded-t-xl text-center min-h-[120px] flex flex-col justify-center">
              <div className="text-2xl font-bold text-gray-700 mb-1">2</div>
              <div className="font-semibold text-gray-900 mb-1">
                {second.first_name} {second.last_name}
              </div>
              <div className="text-sm text-gray-600">Очки: {second.points}</div>
              <div className="text-xs text-gray-500 mt-1">
                Перформанс: {Math.round(1800 + second.points * 50)}
              </div>
            </div>
          </div>
        )}

        {champion && (
          <div className="flex flex-col items-center -mt-4">
            <div className="w-40 h-40 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mb-3 shadow-2xl">
              <Icon name="Trophy" size={80} className="text-white" />
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 px-6 py-10 rounded-t-xl text-center min-h-[140px] flex flex-col justify-center border-2 border-yellow-400">
              <div className="text-3xl font-bold text-yellow-700 mb-2">🏆 1</div>
              <div className="font-bold text-gray-900 text-lg mb-1">
                {champion.first_name} {champion.last_name}
              </div>
              <div className="text-base text-gray-700 font-semibold">Очки: {champion.points}</div>
              <div className="text-sm text-gray-600 mt-1">
                Перформанс: {Math.round(1800 + champion.points * 50)}
              </div>
            </div>
          </div>
        )}

        {third && (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center mb-3 shadow-lg">
              <Icon name="Medal" size={64} className="text-white" />
            </div>
            <div className="bg-amber-50 px-6 py-8 rounded-t-xl text-center min-h-[120px] flex flex-col justify-center">
              <div className="text-2xl font-bold text-amber-700 mb-1">3</div>
              <div className="font-semibold text-gray-900 mb-1">
                {third.first_name} {third.last_name}
              </div>
              <div className="text-sm text-gray-600">Очки: {third.points}</div>
              <div className="text-xs text-gray-500 mt-1">
                Перформанс: {Math.round(1800 + third.points * 50)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PodiumCard;
