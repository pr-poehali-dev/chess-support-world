import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');

  const menuItems = [
    { id: 'home', label: 'Главная', icon: 'Home' },
    { id: 'tournaments', label: 'Турниры', icon: 'Trophy' },
    { id: 'results', label: 'Результаты', icon: 'Award' },
    { id: 'awards', label: 'Награды', icon: 'Medal' },
    { id: 'auth', label: 'Вход', icon: 'LogIn' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.poehali.dev/files/c8bb0d3f-5d90-41d-9d7a-9232853e0511.png" 
                alt="Мир Шахмат" 
                className="h-16 w-auto"
              />
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  onClick={() => setActiveSection(item.id)}
                  className={`gap-2 transition-all ${
                    activeSection === item.id 
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon name={item.icon as any} size={18} />
                  <span className="font-medium">{item.label}</span>
                </Button>
              ))}
            </nav>

            <button className="md:hidden p-2">
              <Icon name="Menu" size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {activeSection === 'home' && (
          <div className="animate-fade-in">
            <section className="text-center py-20">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-black via-gray-800 to-gold bg-clip-text text-transparent">
                Мир Шахмат
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Центр поддержки детского шахматного спорта
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  size="lg" 
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                  onClick={() => setActiveSection('tournaments')}
                >
                  <Icon name="Trophy" size={20} />
                  Турниры
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setActiveSection('auth')}
                  className="gap-2"
                >
                  <Icon name="LogIn" size={20} />
                  Регистрация
                </Button>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6 py-12">
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-gold/50">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                  <Icon name="Trophy" size={24} className="text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Турниры</h3>
                <p className="text-muted-foreground">
                  Регулярные шахматные турниры для детей разных возрастных категорий
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-gold/50">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                  <Icon name="Award" size={24} className="text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Результаты</h3>
                <p className="text-muted-foreground">
                  Отслеживайте результаты соревнований и рейтинги игроков
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-gold/50">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                  <Icon name="Medal" size={24} className="text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Награды</h3>
                <p className="text-muted-foreground">
                  Галерея достижений и награды наших юных шахматистов
                </p>
              </Card>
            </section>
          </div>
        )}

        {activeSection === 'tournaments' && (
          <div className="animate-fade-in text-center py-20">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="Trophy" size={40} className="text-secondary-foreground" />
            </div>
            <h2 className="text-5xl font-bold mb-4">Турниры</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Раздел находится в разработке. Здесь будет информация о предстоящих и завершенных турнирах.
            </p>
          </div>
        )}

        {activeSection === 'results' && (
          <div className="animate-fade-in text-center py-20">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="Award" size={40} className="text-secondary-foreground" />
            </div>
            <h2 className="text-5xl font-bold mb-4">Результаты</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Раздел находится в разработке. Здесь будут результаты турниров и рейтинги участников.
            </p>
          </div>
        )}

        {activeSection === 'awards' && (
          <div className="animate-fade-in text-center py-20">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="Medal" size={40} className="text-secondary-foreground" />
            </div>
            <h2 className="text-5xl font-bold mb-4">Награды</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Раздел находится в разработке. Здесь будет галерея наград и достижений.
            </p>
          </div>
        )}

        {activeSection === 'auth' && (
          <div className="animate-fade-in max-w-md mx-auto py-12">
            <Card className="p-8">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="LogIn" size={32} className="text-secondary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-center mb-6">Вход / Регистрация</h2>
              <p className="text-center text-muted-foreground mb-6">
                Раздел находится в разработке. Здесь будет форма входа и регистрации участников.
              </p>
              <Button className="w-full bg-secondary hover:bg-secondary/90" size="lg">
                Скоро появится
              </Button>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-muted/30 py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://cdn.poehali.dev/files/c8bb0d3f-5d90-41d-9d7a-9232853e0511.png" 
              alt="Мир Шахмат" 
              className="h-12 w-auto"
            />
          </div>
          <p className="text-muted-foreground">
            © 2024 Мир Шахмат. Центр поддержки детского шахматного спорта
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;