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

interface Tournament {
  id: number;
  title: string;
  name?: string;
  status: string;
  current_round?: number;
  rounds: number;
  total_rounds?: number;
}

interface StandingsTableProps {
  standings: Standing[];
  tournament: Tournament | null;
}

const StandingsTable = ({ standings, tournament }: StandingsTableProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Турнирная таблица</h2>
      
      {standings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Нет результатов</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left p-3 font-bold text-gray-700">#</th>
                <th className="text-left p-3 font-bold text-gray-700">Участник</th>
                <th className="text-center p-3 font-bold text-gray-700">Очки</th>
                {tournament?.rounds && Array.from({ length: tournament.rounds }, (_, i) => i + 1).map((round) => (
                  <th key={round} className="text-center p-2 font-bold text-gray-700 text-xs bg-blue-50">{round}</th>
                ))}
                <th className="text-center p-3 font-bold text-gray-700">Партий</th>
                <th className="text-center p-3 font-bold text-gray-700 bg-green-50">+</th>
                <th className="text-center p-3 font-bold text-gray-700 bg-gray-100">=</th>
                <th className="text-center p-3 font-bold text-gray-700 bg-red-50">-</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((player) => (
                <tr
                  key={player.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    player.rank <= 3 ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {player.rank <= 3 && (
                        <Icon 
                          name="Medal" 
                          size={18} 
                          className={
                            player.rank === 1 ? 'text-yellow-500' :
                            player.rank === 2 ? 'text-gray-400' :
                            'text-amber-600'
                          }
                        />
                      )}
                      <span className="font-semibold text-gray-900">{player.rank}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">
                      {player.first_name} {player.last_name}
                    </div>
                    {player.birth_date && (
                      <div className="text-xs text-gray-500">
                        {new Date().getFullYear() - new Date(player.birth_date).getFullYear()} лет
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-lg text-blue-600">{player.points}</span>
                  </td>
                  {tournament?.rounds && Array.from({ length: tournament.rounds }, (_, i) => i + 1).map((round) => (
                    <td key={round} className="p-2 text-center bg-blue-50">
                      <span className="text-xs text-gray-600">{player.round_results?.[round] || '-'}</span>
                    </td>
                  ))}
                  <td className="p-3 text-center text-gray-700">
                    {player.games_played}
                  </td>
                  <td className="p-3 text-center bg-green-50 text-green-700 font-semibold">
                    {player.wins}
                  </td>
                  <td className="p-3 text-center bg-gray-100 text-gray-700 font-semibold">
                    {player.draws}
                  </td>
                  <td className="p-3 text-center bg-red-50 text-red-700 font-semibold">
                    {player.losses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default StandingsTable;
