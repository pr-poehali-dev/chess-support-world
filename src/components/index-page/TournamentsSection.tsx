import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Tournament {
  id: number;
  title: string;
  description: string;
  status: string;
  start_date: string | null;
  start_time: string | null;
  tournament_type: string | null;
  time_control: string | null;
  max_participants: number | null;
  entry_fee: number | null;
  name: string;
}

interface TournamentsSectionProps {
  tournaments: Tournament[];
  registrationStatuses: Record<number, boolean>;
  onRegister: (tournamentId: number) => void;
  onNavigateToHall: (tournamentId: number) => void;
  onShowParticipants: (tournamentId: number, tournamentName: string) => void;
}

const TournamentsSection = ({
  tournaments,
  registrationStatuses,
  onRegister,
  onNavigateToHall,
  onShowParticipants
}: TournamentsSectionProps) => {
  const statusConfig: Record<string, {label: string, bg: string, text: string, icon: string}> = {
    registration_open: {
      label: 'Регистрация открыта',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      icon: 'UserPlus'
    },
    in_progress: {
      label: 'Идет сейчас',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'Trophy'
    },
    finished: {
      label: 'Завершен',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      icon: 'Crown'
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon name="Trophy" size={40} className="text-yellow-600" />
        </div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Турниры</h2>
        <p className="text-lg text-gray-600">
          Участвуйте в наших шахматных турнирах
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Нет доступных турниров</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tournaments.map((tournament) => {
            const config = statusConfig[tournament.status] || statusConfig.registration_open;

            return (
              <Card key={tournament.id} className="p-8 bg-white hover:shadow-xl transition-all border-l-4 border-l-yellow-400">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex gap-6 flex-1">
                    <div className="p-4 bg-yellow-100 rounded-xl">
                      <Icon name={config.icon} size={32} className="text-yellow-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-gray-900">{tournament.title}</h3>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                      </div>

                      {tournament.description && (
                        <p className="text-gray-700 mb-6 leading-relaxed">{tournament.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tournament.start_date && (
                          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
                            <Icon name="Calendar" size={20} className="text-yellow-600" />
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Дата начала</div>
                              <div className="font-semibold text-gray-900">
                                {new Date(tournament.start_date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})}
                                {tournament.start_time && (
                                  <span className="text-gray-600"> в {tournament.start_time.slice(0, 5)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {tournament.tournament_type && (
                          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
                            <Icon name="Zap" size={20} className="text-orange-500" />
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Формат</div>
                              <div className="font-semibold text-gray-900">
                                {tournament.tournament_type === 'blitz' ? 'Блиц' : 'Рапид'}
                                {tournament.time_control && ` ${tournament.time_control}`}
                              </div>
                            </div>
                          </div>
                        )}

                        {tournament.max_participants && (
                          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
                            <Icon name="Users" size={20} className="text-blue-500" />
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Участников</div>
                              <div className="font-semibold text-gray-900">До {tournament.max_participants} человек</div>
                            </div>
                          </div>
                        )}

                        {tournament.entry_fee !== undefined && tournament.entry_fee > 0 && (
                          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
                            <Icon name="Wallet" size={20} className="text-green-500" />
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Орг. взнос</div>
                              <div className="font-semibold text-gray-900">{tournament.entry_fee} ₽</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {tournament.status === 'in_progress' && (
                      <Button 
                        onClick={() => onNavigateToHall(tournament.id)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Icon name="Play" size={18} />
                        Турнирный зал
                      </Button>
                    )}
                    
                    {tournament.status === 'registration_open' && (
                      <Button 
                        onClick={() => onRegister(tournament.id)}
                        className={`gap-2 ${
                          registrationStatuses[tournament.id]
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-yellow-500 hover:bg-yellow-600'
                        } text-white`}
                      >
                        <Icon name={registrationStatuses[tournament.id] ? "UserX" : "UserPlus"} size={18} />
                        {registrationStatuses[tournament.id] ? 'Отменить участие' : 'Записаться'}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => onShowParticipants(tournament.id, tournament.name)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Icon name="Users" size={18} />
                      Список участников
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TournamentsSection;
