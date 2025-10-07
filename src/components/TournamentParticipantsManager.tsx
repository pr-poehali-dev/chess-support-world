import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
}

interface User {
  id: number;
  full_name: string;
  last_name: string;
  birth_date: string;
}

interface TournamentParticipantsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: number;
  tournamentName: string;
}

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export default function TournamentParticipantsManager({
  open,
  onOpenChange,
  tournamentId,
  tournamentName
}: TournamentParticipantsManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && tournamentId) {
      loadParticipants();
      loadAllUsers();
    }
  }, [open, tournamentId]);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/a2820ab8-0fe3-407b-b59e-150af520d9a4?tournament_id=${tournamentId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      } else {
        throw new Error('Failed to load participants');
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список участников",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'https://functions.poehali.dev/3f935536-bf55-40d4-a802-ceca76ba3331',
        {
          headers: {
            'X-Auth-Token': token || ''
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddParticipant = async (userId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'https://functions.poehali.dev/28ea3173-5546-49f4-b7e1-611bcdd14d7b',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token || ''
          },
          body: JSON.stringify({
            tournament_id: tournamentId,
            player_id: userId
          })
        }
      );

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Участник добавлен"
        });
        loadParticipants();
        setShowAddUser(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add participant');
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить участника",
        variant: "destructive"
      });
    }
  };

  const handleRemoveParticipant = async (userId: number) => {
    if (!confirm('Удалить участника из турнира?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `https://functions.poehali.dev/28ea3173-5546-49f4-b7e1-611bcdd14d7b?tournament_id=${tournamentId}&player_id=${userId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Auth-Token': token || ''
          }
        }
      );

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Участник удален"
        });
        loadParticipants();
      } else {
        throw new Error('Failed to remove participant');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить участника",
        variant: "destructive"
      });
    }
  };

  const availableUsers = allUsers.filter(
    user => !participants.some(p => p.id === user.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Управление участниками: {tournamentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Зарегистрировано: <span className="font-semibold">{participants.length}</span>
            </p>
            <Button
              onClick={() => setShowAddUser(!showAddUser)}
              size="sm"
              className="bg-chess-gold hover:bg-chess-gold/90 text-chess-dark"
            >
              <Icon name="UserPlus" size={16} className="mr-2" />
              Добавить участника
            </Button>
          </div>

          {showAddUser && (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
              <h3 className="font-semibold text-sm mb-2">Выберите пользователя:</h3>
              {loadingUsers ? (
                <div className="flex justify-center py-4">
                  <Icon name="Loader2" size={24} className="animate-spin text-chess-gold" />
                </div>
              ) : availableUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Все пользователи уже добавлены
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {availableUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-white rounded hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {user.last_name} {user.full_name}
                        </span>
                        {user.birth_date && (
                          <span className="text-xs text-gray-500">
                            ({calculateAge(user.birth_date)} лет)
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => handleAddParticipant(user.id)}
                        size="sm"
                        variant="outline"
                        className="h-7"
                      >
                        <Icon name="Plus" size={14} className="mr-1" />
                        Добавить
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin">
                <Icon name="Loader2" size={32} className="text-chess-gold" />
              </div>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Users" size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">Пока нет участников</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 w-12">№</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Фамилия</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Имя</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 w-24">Возраст</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 w-20">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr
                      key={participant.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {participant.last_name}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {participant.first_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">
                        {calculateAge(participant.birth_date)} лет
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => handleRemoveParticipant(participant.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}