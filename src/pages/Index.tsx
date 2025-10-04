import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import AuthForm from '@/components/AuthForm';
import Header from '@/components/Header';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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



  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onUserChange={setUser} />

      <main className="container mx-auto px-4 py-12">
        {activeSection === 'home' && (
          <div className="animate-fade-in">
            <section className="text-center py-16 max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900">
                Мир Шахмат
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Центр поддержки детского шахматного спорта
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button 
                  size="lg" 
                  className="bg-secondary hover:bg-secondary/90 text-black gap-2"
                  onClick={() => setActiveSection('tournaments')}
                >
                  <Icon name="Trophy" size={20} />
                  Турниры
                </Button>
                {!user && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => setActiveSection('auth')}
                    className="gap-2"
                  >
                    <Icon name="LogIn" size={20} />
                    Регистрация
                  </Button>
                )}
              </div>
            </section>

            <section className="max-w-6xl mx-auto py-8">
              {news.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                    <Icon name="Newspaper" size={32} className="text-blue-600" />
                    Новости
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {news.map((item) => (
                      <Card key={item.id} className="p-6 bg-white hover:shadow-lg transition-all overflow-hidden">
                        {item.imageUrl && (
                          <div className="-m-6 mb-4">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-${item.iconColor}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon name={item.iconName} size={24} className={`text-${item.iconColor}-600`} />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 mb-1">
                              {new Date(item.publishedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            <h4 className="text-lg font-bold mb-2 text-gray-900">{item.title}</h4>
                            <p className="text-gray-600 text-sm mb-3">{item.preview}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedNews(item);
                                setNewsDialogOpen(true);
                              }}
                              className="gap-2"
                            >
                              Подробнее
                              <Icon name="ArrowRight" size={16} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 hover:shadow-lg transition-all bg-white">
                  <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon name="Trophy" size={28} className="text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Турниры</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Регулярные шахматные турниры для детей разных возрастных категорий
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-all bg-white">
                  <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon name="Award" size={28} className="text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Результаты</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Отслеживайте результаты соревнований и рейтинги игроков
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-all bg-white">
                  <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon name="Medal" size={28} className="text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Награды</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Галерея достижений и награды наших юных шахматистов
                  </p>
                </Card>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'tournaments' && (
          <div className="animate-fade-in text-center py-20 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon name="Trophy" size={40} className="text-yellow-600" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Турниры</h2>
            <p className="text-lg text-gray-600">
              Раздел находится в разработке. Здесь будет информация о предстоящих и завершенных турнирах.
            </p>
          </div>
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

      <Dialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedNews && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedNews.title}</DialogTitle>
              </DialogHeader>
              
              {selectedNews.imageUrl && (
                <div className="-mx-6 -mt-4 mb-4">
                  <img
                    src={selectedNews.imageUrl}
                    alt={selectedNews.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className={`w-10 h-10 bg-${selectedNews.iconColor}-100 rounded-lg flex items-center justify-center`}>
                    <Icon name={selectedNews.iconName} size={20} className={`text-${selectedNews.iconColor}-600`} />
                  </div>
                  <span>
                    {new Date(selectedNews.publishedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedNews.content}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default Index;