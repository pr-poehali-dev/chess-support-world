import { Card } from '@/components/ui/card';

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

interface TournamentStatsProps {
  standings: Standing[];
}

const TournamentStats = ({ standings }: TournamentStatsProps) => {
  const totalGames = standings.reduce((sum, s) => sum + s.games_played, 0);
  const totalWhiteWins = standings.reduce((sum, s) => sum + s.wins, 0);
  const totalBlackWins = standings.reduce((sum, s) => sum + s.losses, 0);
  const totalDraws = standings.reduce((sum, s) => sum + s.draws, 0);

  return (
    <Card className="p-6 sticky top-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Статистика турнира</h3>
    
      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Средний рейтинг</span>
          <span className="font-bold text-gray-900">
            {standings.length > 0 ? Math.round(standings.reduce((sum, s) => sum + 1800, 0) / standings.length) : 0}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Сыграно партий</span>
          <span className="font-bold text-gray-900">{Math.floor(totalGames / 2)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Побед белыми</span>
          <span className="font-bold text-gray-900">
            {totalGames > 0 ? Math.round((totalWhiteWins / (totalGames / 2)) * 100) : 0}%
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Побед чёрными</span>
          <span className="font-bold text-gray-900">
            {totalGames > 0 ? Math.round((totalBlackWins / (totalGames / 2)) * 100) : 0}%
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Показатель ничьих</span>
          <span className="font-bold text-gray-900">
            {totalGames > 0 ? Math.round((totalDraws / (totalGames / 2)) * 100) : 0}%
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Автопобеды</span>
          <span className="font-bold text-gray-900">0%</span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Отсутствие</span>
          <span className="font-bold text-gray-900">0%</span>
        </div>
      </div>
    </Card>
  );
};

export default TournamentStats;
