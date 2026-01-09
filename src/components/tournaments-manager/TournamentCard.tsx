import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Tournament {
  id: number;
  title: string;
  description: string;
  start_date: string | null;
  start_time: string | null;
  location: string;
  max_participants: number | null;
  time_control: string | null;
  tournament_type: 'blitz' | 'rapid' | null;
  entry_fee: number | null;
  rounds: number | null;
  status: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'finished';
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  draft: {
    label: 'Черновик',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    card: 'border-l-4 border-l-gray-400 bg-gradient-to-r from-gray-50 to-white',
    icon: 'FileText',
    iconColor: 'text-gray-500'
  },
  registration_open: {
    label: 'Идет прием заявок',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-400',
    card: 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white shadow-emerald-100 shadow-md',
    icon: 'UserPlus',
    iconColor: 'text-emerald-600'
  },
  registration_closed: {
    label: 'Регистрация закрыта',
    badge: 'bg-amber-100 text-amber-800 border-amber-400',
    card: 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white shadow-amber-100 shadow-md',
    icon: 'Lock',
    iconColor: 'text-amber-600'
  },
  in_progress: {
    label: 'Идет сейчас',
    badge: 'bg-blue-100 text-blue-800 border-blue-400',
    card: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-blue-100 shadow-md',
    icon: 'Trophy',
    iconColor: 'text-blue-600'
  },
  finished: {
    label: 'Окончен',
    badge: 'bg-purple-100 text-purple-800 border-purple-400',
    card: 'border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 to-white',
    icon: 'Crown',
    iconColor: 'text-purple-600'
  }
};

interface TournamentCardProps {
  tournament: Tournament;
  onEdit: (tournament: Tournament) => void;
  onDelete: (id: number) => void;
  onManageParticipants: (tournament: Tournament) => void;
}

const TournamentCard = ({ tournament, onEdit, onDelete, onManageParticipants }: TournamentCardProps) => {
  const config = statusConfig[tournament.status];

  return (
    <Card className={`p-6 hover:shadow-lg transition-all ${config.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className={`p-3 rounded-xl bg-white shadow-sm ${config.iconColor}`}>
            <Icon name={config.icon} size={28} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-chess-dark">{tournament.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${config.badge}`}>
                {config.label}
              </span>
            </div>

            {tournament.description && (
              <p className="text-gray-700 mb-4 leading-relaxed">{tournament.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {tournament.start_date && (
                <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                  <Icon name="Calendar" size={16} className="text-chess-gold" />
                  <span className="font-medium">
                    {new Date(tournament.start_date).toLocaleDateString('ru-RU')}
                    {tournament.start_time && ` в ${tournament.start_time.slice(0, 5)}`}
                  </span>
                </div>
              )}
              {tournament.tournament_type && (
                <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                  <Icon name="Zap" size={16} className="text-orange-500" />
                  <span className="font-medium">
                    {tournament.tournament_type === 'blitz' ? 'Блиц' : 'Рапид'}
                    {tournament.time_control && ` ${tournament.time_control}`}
                  </span>
                </div>
              )}

              {tournament.max_participants && (
                <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                  <Icon name="Users" size={16} className="text-blue-500" />
                  <span className="font-medium">До {tournament.max_participants} участников</span>
                </div>
              )}

              {tournament.entry_fee !== null && tournament.entry_fee > 0 && (
                <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                  <Icon name="Wallet" size={16} className="text-green-500" />
                  <span className="font-medium">Орг. взнос: {tournament.entry_fee} ₽</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onManageParticipants(tournament)}
            variant="outline"
            size="sm"
            className="border-green-400 text-green-700 hover:bg-green-50 hover:border-green-500"
          >
            <Icon name="Users" size={16} />
          </Button>
          <Button
            onClick={() => onEdit(tournament)}
            variant="outline"
            size="sm"
            className="border-blue-400 text-blue-700 hover:bg-blue-50 hover:border-blue-500"
          >
            <Icon name="Edit" size={16} />
          </Button>
          <Button
            onClick={() => onDelete(tournament.id)}
            variant="outline"
            size="sm"
            className="border-red-400 text-red-700 hover:bg-red-50 hover:border-red-500"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TournamentCard;