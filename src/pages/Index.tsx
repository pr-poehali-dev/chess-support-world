import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AuthForm from '@/components/AuthForm';
import Header from '@/components/Header';
import TournamentParticipantsModal from '@/components/TournamentParticipantsModal';
import HomeSection from '@/components/index-page/HomeSection';
import TournamentsSection from '@/components/index-page/TournamentsSection';
import TopUpModal from '@/components/index-page/TopUpModal';
import InsufficientBalanceModal from '@/components/index-page/InsufficientBalanceModal';
import NewsDialog from '@/components/index-page/NewsDialog';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [registrationStatuses, setRegistrationStatuses] = useState<Record<number, boolean>>({});
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [selectedTournamentName, setSelectedTournamentName] = useState('');
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState<{
    open: boolean;
    required: number;
    current: number;
  }>({ open: false, required: 0, current: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      
      if (token) {
        fetch('https://functions.poehali.dev/eca2e5eb-f266-4d23-85b9-37172d2bc017', {
          method: 'GET',
          headers: {
            'X-Auth-Token': token
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          })
          .catch(err => console.error('Failed to load user data:', err));
      }
    }

    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section) {
      setActiveSection(section);
    } else {
      setActiveSection('home');
    }

    fetch('https://functions.poehali.dev/3b2af78a-d7e9-4e97-9f99-5f06bcaf9560')
      .then(res => res.json())
      .then(data => {
        if (data.news) {
          setNews(data.news);
        }
      })
      .catch(err => console.error('Failed to load news:', err));

    const loadTournaments = () => {
      fetch('https://functions.poehali.dev/fb78feda-e1cb-4b60-a6c8-7bde514e8308')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const activeTournaments = data.filter(t => t.status !== 'draft');
            setTournaments(activeTournaments);
            
            if (storedUser) {
              const userId = JSON.parse(storedUser).id;
              activeTournaments.forEach(tournament => {
                checkRegistrationStatus(tournament.id, userId);
              });
            }
          }
        })
        .catch(err => console.error('Failed to load tournaments:', err));
    };

    loadTournaments();
    
    const autoStartInterval = setInterval(() => {
      fetch('https://functions.poehali.dev/03f0763f-eda0-46e1-bd1d-51c46dd1f5a6', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.started_tournaments && data.started_tournaments.length > 0) {
            loadTournaments();
            toast({
              title: "Турнир начался!",
              description: `Запущено туров: ${data.started_tournaments.length}`,
            });
          }
        })
        .catch(err => console.error('Auto-start check failed:', err));
    }, 60000);

    return () => clearInterval(autoStartInterval);

    const verifyToken = params.get('verify');
    
    if (verifyToken) {
      console.log('Verifying token:', verifyToken);
      fetch(`https://functions.poehali.dev/7f5b6427-1db5-4cce-b41c-6fafdb571e1e?token=${verifyToken}`)
        .then(async res => {
          console.log('Response status:', res.status);
          const text = await res.text();
          console.log('Response text:', text);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${text}`);
          }
          return JSON.parse(text);
        })
        .then(data => {
          console.log('Response data:', data);
          if (data.success) {
            toast({
              title: "Email подтверждён!",
              description: "Теперь вы можете войти в систему",
            });
            window.history.replaceState({}, '', '/');
          } else {
            toast({
              title: "Ошибка",
              description: data.error || "Не удалось подтвердить email",
              variant: "destructive"
            });
          }
        })
        .catch((error) => {
          console.error('Verification error:', error);
          toast({
            title: "Ошибка",
            description: error.message || "Не удалось подтвердить email",
            variant: "destructive"
          });
        });
    }
  }, [location.search]);

  const fetchUser = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      try {
        const response = await fetch(
          `https://functions.poehali.dev/4febeae0-8d66-41f4-ab59-c8e4f0ab0adc`,
          {
            headers: {
              'X-User-Id': currentUser.id.toString()
            }
          }
        );
        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
  };

  const checkRegistrationStatus = async (tournamentId: number, userId: number) => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/488e552a-8ff0-46f5-9a68-b1f9773a039b?tournament_id=${tournamentId}`,
        {
          headers: {
            'X-User-Id': userId.toString()
          }
        }
      );
      const data = await response.json();
      setRegistrationStatuses(prev => ({
        ...prev,
        [tournamentId]: data.is_registered && data.status === 'registered'
      }));
    } catch (error) {
      console.error('Failed to check registration status:', error);
    }
  };

  const handleTournamentRegistration = async (tournamentId: number) => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для регистрации на турнир",
        variant: "destructive"
      });
      return;
    }

    const isRegistered = registrationStatuses[tournamentId];

    try {
      if (isRegistered) {
        const response = await fetch(
          `https://functions.poehali.dev/488e552a-8ff0-46f5-9a68-b1f9773a039b?tournament_id=${tournamentId}`,
          {
            method: 'DELETE',
            headers: {
              'X-User-Id': user.id.toString()
            }
          }
        );

        const cancelData = await response.json();
        
        if (response.ok) {
          setRegistrationStatuses(prev => ({
            ...prev,
            [tournamentId]: false
          }));
          
          const refundMsg = cancelData.refund > 0 
            ? ` Вам возвращен взнос ${cancelData.refund} ₽`
            : '';
          
          toast({
            title: "Участие отменено",
            description: "Вы успешно отменили регистрацию на турнир" + refundMsg
          });
          
          if (cancelData.refund > 0) {
            fetchUser();
          }
        }
      } else {
        const response = await fetch(
          'https://functions.poehali.dev/488e552a-8ff0-46f5-9a68-b1f9773a039b',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': user.id.toString()
            },
            body: JSON.stringify({ tournament_id: tournamentId })
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setRegistrationStatuses(prev => ({
            ...prev,
            [tournamentId]: true
          }));
          
          const feeMsg = data.fee_paid > 0 
            ? ` Списан взнос ${data.fee_paid} ₽`
            : '';
          
          toast({
            title: "Успешно!",
            description: "Вы зарегистрированы на турнир" + feeMsg
          });
          
          if (data.fee_paid > 0) {
            fetchUser();
          }
        } else {
          if (data.error === 'Insufficient balance') {
            setInsufficientBalanceModal({
              open: true,
              required: data.required || 0,
              current: data.current || 0
            });
          } else {
            toast({
              title: "Ошибка",
              description: data.error || "Не удалось зарегистрироваться",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при регистрации",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onUserChange={setUser} onTopUpClick={() => setTopUpModalOpen(true)} />

      <main className="container mx-auto px-4 py-12">
        {activeSection === 'home' && (
          <HomeSection
            news={news}
            user={user}
            onNavigateToTournaments={() => setActiveSection('tournaments')}
            onNavigateToAuth={() => setActiveSection('auth')}
            onNewsClick={(newsItem) => {
              setSelectedNews(newsItem);
              setNewsDialogOpen(true);
            }}
          />
        )}

        {activeSection === 'tournaments' && (
          <TournamentsSection
            tournaments={tournaments}
            registrationStatuses={registrationStatuses}
            onRegister={handleTournamentRegistration}
            onNavigateToHall={(id) => navigate(`/tournament/${id}`)}
            onShowParticipants={(id, name) => {
              setSelectedTournamentId(id);
              setSelectedTournamentName(name);
              setParticipantsModalOpen(true);
            }}
          />
        )}

        {activeSection === 'results' && (
          <div className="animate-fade-in text-center py-20 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon name="Award" size={40} className="text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Результаты</h2>
            <p className="text-lg text-gray-600">
              Раздел находится в разработке. Здесь будут результаты турниров и рейтинги участников.
            </p>
          </div>
        )}

        {activeSection === 'awards' && (
          <div className="animate-fade-in text-center py-20 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon name="Medal" size={40} className="text-green-600" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Награды</h2>
            <p className="text-lg text-gray-600">
              Раздел находится в разработке. Здесь будет галерея наград и достижений.
            </p>
          </div>
        )}

        {activeSection === 'auth' && (
          <div className="animate-fade-in py-12">
            <AuthForm onSuccess={(userData) => {
              setUser(userData);
              setActiveSection('home');
            }} />
          </div>
        )}
      </main>

      <NewsDialog
        open={newsDialogOpen}
        news={selectedNews}
        onOpenChange={setNewsDialogOpen}
      />

      <footer className="border-t bg-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://cdn.poehali.dev/files/c8bb0d3f-5d90-41d2-9d7a-9232853e0511.png" 
              alt="Мир Шахмат" 
              className="h-12 w-auto"
            />
          </div>
          <p className="text-gray-600">
            © 2024 Мир Шахмат. Центр поддержки детского шахматного спорта
          </p>
        </div>
      </footer>

      <TopUpModal
        open={topUpModalOpen}
        amount={topUpAmount}
        onAmountChange={setTopUpAmount}
        userId={user?.id}
        onClose={() => {
          setTopUpModalOpen(false);
          setTopUpAmount('');
        }}
      />

      {selectedTournamentId && (
        <TournamentParticipantsModal
          open={participantsModalOpen}
          onOpenChange={setParticipantsModalOpen}
          tournamentId={selectedTournamentId}
          tournamentName={selectedTournamentName}
        />
      )}

      <InsufficientBalanceModal
        open={insufficientBalanceModal.open}
        required={insufficientBalanceModal.required}
        current={insufficientBalanceModal.current}
        onTopUp={(amount) => {
          setTopUpAmount(amount);
          setTopUpModalOpen(true);
        }}
        onClose={() => setInsufficientBalanceModal({ open: false, required: 0, current: 0 })}
      />
    </div>
  );
};

export default Index;