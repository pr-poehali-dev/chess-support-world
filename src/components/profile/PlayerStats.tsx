import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const STATS_URL = 'https://functions.poehali.dev/5a73b0f2-82c7-47e0-803f-c04104a06384';

interface Stats {
  total: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number;
}

interface Game {
  id: string;
  status: string;
  winner: string;
  my_color: string;
  my_result: 'win' | 'draw' | 'loss';
  time_control: string | null;
  created_at: string | null;
  tournament_id: number | null;
  tournament_title: string | null;
  round_number: number | null;
  opponent_name: string;
}

interface Tournament {
  id: number;
  title: string;
  status: string;
  tournament_type: string | null;
  time_control: string | null;
  start_date: string | null;
  rounds: number | null;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

const resultLabel = {
  win: { text: 'Победа', cls: 'bg-green-100 text-green-800' },
  draw: { text: 'Ничья', cls: 'bg-gray-100 text-gray-700' },
  loss: { text: 'Поражение', cls: 'bg-red-100 text-red-800' },
};

const statusLabel: Record<string, string> = {
  active: 'Идёт',
  finished: 'Завершён',
  draft: 'Черновик',
  registration: 'Регистрация',
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatStatus = (s: string) => {
  const map: Record<string, string> = {
    checkmate: 'Мат',
    resignation: 'Сдался',
    timeout: 'Время',
    draw: 'Ничья',
    stalemate: 'Пат',
  };
  return map[s] || s;
};

type Tab = 'stats' | 'games' | 'tournaments';

interface PlayerStatsProps {
  userId: number;
}

export default function PlayerStats({ userId: _userId }: PlayerStatsProps) {
  const [tab, setTab] = useState<Tab>('stats');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setLoading(true);
    fetch(STATS_URL, { headers: { 'X-Auth-Token': token } })
      .then(r => r.json())
      .then(data => {
        setStats(data.stats);
        setGames(data.games);
        setTournaments(data.tournaments);
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'stats', label: 'Статистика', icon: 'BarChart3' },
    { id: 'games', label: 'Партии', icon: 'Swords' },
    { id: 'tournaments', label: 'Турниры', icon: 'Trophy' },
  ];

  return (
    <div className="mt-8">
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={28} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {tab === 'stats' && stats && (
            <div className="space-y-4">
              {/* Круговая диаграмма заменена на карточки */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
                  <div className="text-sm text-blue-600 mt-1">Всего партий</div>
                </Card>
                <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="text-3xl font-bold text-purple-700">{stats.win_rate}%</div>
                  <div className="text-sm text-purple-600 mt-1">Процент побед</div>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="text-2xl font-bold text-green-700">{stats.wins}</div>
                  <div className="text-xs text-green-600 mt-1 font-medium">Победы</div>
                </Card>
                <Card className="p-4 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                  <div className="text-2xl font-bold text-gray-700">{stats.draws}</div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">Ничьи</div>
                </Card>
                <Card className="p-4 text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <div className="text-2xl font-bold text-red-700">{stats.losses}</div>
                  <div className="text-xs text-red-600 mt-1 font-medium">Поражения</div>
                </Card>
              </div>

              {stats.total > 0 && (
                <Card className="p-4">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Соотношение результатов</div>
                  <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                    {stats.wins > 0 && (
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${(stats.wins / stats.total) * 100}%` }}
                        title={`Победы: ${stats.wins}`}
                      />
                    )}
                    {stats.draws > 0 && (
                      <div
                        className="bg-gray-400 transition-all"
                        style={{ width: `${(stats.draws / stats.total) * 100}%` }}
                        title={`Ничьи: ${stats.draws}`}
                      />
                    )}
                    {stats.losses > 0 && (
                      <div
                        className="bg-red-500 transition-all"
                        style={{ width: `${(stats.losses / stats.total) * 100}%` }}
                        title={`Поражения: ${stats.losses}`}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span className="text-green-600">{stats.wins}П</span>
                    <span className="text-gray-500">{stats.draws}Н</span>
                    <span className="text-red-600">{stats.losses}П</span>
                  </div>
                </Card>
              )}

              {stats.total === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Icon name="Swords" size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Партии ещё не сыграны</p>
                </div>
              )}
            </div>
          )}

          {tab === 'games' && (
            <div className="space-y-2">
              {games.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Icon name="Swords" size={40} className="mx-auto mb-3 opacity-30" />
                  <p>История партий пуста</p>
                </div>
              ) : (
                games.map(g => {
                  const res = resultLabel[g.my_result];
                  return (
                    <Card key={g.id} className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-2 h-10 rounded-full flex-shrink-0 ${g.my_result === 'win' ? 'bg-green-500' : g.my_result === 'draw' ? 'bg-gray-400' : 'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{g.opponent_name}</span>
                          {g.tournament_title && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                              {g.tournament_title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <span>{g.my_color === 'white' ? '♔ Белые' : '♚ Чёрные'}</span>
                          {g.time_control && <span>· {g.time_control}</span>}
                          {g.round_number && <span>· Тур {g.round_number}</span>}
                          <span>· {formatDate(g.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${res.cls}`}>
                          {res.text}
                        </span>
                        <span className="text-xs text-gray-400">{formatStatus(g.status)}</span>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {tab === 'tournaments' && (
            <div className="space-y-3">
              {tournaments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Icon name="Trophy" size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Турниры ещё не сыграны</p>
                </div>
              ) : (
                tournaments.map(t => (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{t.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {statusLabel[t.status] || t.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2">
                          {t.tournament_type && <span>{t.tournament_type === 'swiss' ? 'Швейцарская' : 'Круговая'}</span>}
                          {t.time_control && <span>· {t.time_control}</span>}
                          {t.start_date && <span>· {formatDate(t.start_date)}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-gray-800">{t.points} очк.</div>
                        <div className="text-xs text-gray-400">{t.games_played} партий</div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        <span className="text-gray-600">{t.wins} победы</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                        <span className="text-gray-600">{t.draws} ничьи</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                        <span className="text-gray-600">{t.losses} пораж.</span>
                      </div>
                      {t.id && (
                        <a
                          href={`/tournament/${t.id}`}
                          className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Icon name="ExternalLink" size={12} />
                          Турнир
                        </a>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}