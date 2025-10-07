import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
}

interface TournamentParticipantsModalProps {
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

export default function TournamentParticipantsModal({
  open,
  onOpenChange,
  tournamentId,
  tournamentName
}: TournamentParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && tournamentId) {
      loadParticipants();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Участники турнира: {tournamentName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin">
              <Icon name="Loader2" size={32} className="text-yellow-500" />
            </div>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon name="Users" size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Пока нет участников</p>
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 font-semibold text-lg w-8">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="font-semibold text-lg text-gray-900">
                      {participant.last_name} {participant.first_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="Cake" size={18} />
                  <span className="font-medium">{calculateAge(participant.birth_date)} лет</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && participants.length > 0 && (
          <div className="mt-4 pt-4 border-t text-center text-gray-500">
            Всего участников: <span className="font-semibold">{participants.length}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}