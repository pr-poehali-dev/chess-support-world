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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.poehali.dev/files/c8bb0d3f-5d90-41d-9d7a-9232853e0511.png" 
                alt="Мир Шахмат" 
                className="h-20 w-auto"
              />
            </div>
            
            <nav className="hidden md:flex items-center gap-2">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  onClick={() => setActiveSection(item.id)}
                  className={`gap-2 transition-all text-base font-semibold px-6 py-6 rounded-xl ${
                    activeSection === item.id 
                      ? 'bg-secondary text-black hover:bg-secondary/90 shadow-lg' 
                      : 'hover:bg-blue-100'
                  }`}
                >
                  <Icon name={item.icon as any} size={22} />
                  <span>{item.label}</span>
                </Button>
              ))}
            </nav>

            <button className="md:hidden p-3 hover:bg-blue-50 rounded-lg">
              <Icon name="Menu" size={28} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {activeSection === 'home' && (
          <div className="animate-fade-in">
            <section className="text-center py-16">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-gold">
                ♟️ Мир Шахмат ♟️
              </h1>
              <p className="text-2xl md:text-3xl font-medium text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed">
                Центр поддержки детского шахматного спорта
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  size="lg" 
                  className="bg-secondary hover:bg-yellow-400 text-black gap-3 text-lg font-bold px-8 py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => setActiveSection('tournaments')}
                >
                  <Icon name="Trophy" size={24} />
                  Турниры
                </Button>
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-blue-700 text-white gap-3 text-lg font-bold px-8 py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => setActiveSection('auth')}
                >
                  <Icon name="LogIn" size={24} />
                  Регистрация
                </Button>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-8 py-12">
              <Card className="p-8 hover:shadow-2xl transition-all border-4 border-blue-200 hover:border-yellow-400 rounded-3xl bg-white hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="Trophy" size={36} className="text-black" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-800">Турниры</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Регулярные шахматные турниры для детей разных возрастных категорий
                </p>
              </Card>

              <Card className="p-8 hover:shadow-2xl transition-all border-4 border-purple-200 hover:border-yellow-400 rounded-3xl bg-white hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="Award" size={36} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-800">Результаты</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Отслеживайте результаты соревнований и рейтинги игроков
                </p>
              </Card>

              <Card className="p-8 hover:shadow-2xl transition-all border-4 border-green-200 hover:border-yellow-400 rounded-3xl bg-white hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="Medal" size={36} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-800">Награды</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Галерея достижений и награды наших юных шахматистов
                </p>
              </Card>
            </section>
          </div>
        )}

        {activeSection === 'tournaments' && (
          <div className="animate-fade-in text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Icon name="Trophy" size={64} className="text-black" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">🏆 Турниры</h2>
            <p className="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Раздел находится в разработке. Здесь будет информация о предстоящих и завершенных турнирах.
            </p>
          </div>
        )}

        {activeSection === 'results' && (
          <div className="animate-fade-in text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Icon name="Award" size={64} className="text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">🎖️ Результаты</h2>
            <p className="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Раздел находится в разработке. Здесь будут результаты турниров и рейтинги участников.
            </p>
          </div>
        )}

        {activeSection === 'awards' && (
          <div className="animate-fade-in text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Icon name="Medal" size={64} className="text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">🏅 Награды</h2>
            <p className="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Раздел находится в разработке. Здесь будет галерея наград и достижений.
            </p>
          </div>
        )}

        {activeSection === 'auth' && (
          <div className="animate-fade-in max-w-lg mx-auto py-12">
            <Card className="p-10 rounded-3xl shadow-2xl border-4 border-blue-200">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Icon name="LogIn" size={48} className="text-white" />
              </div>
              <h2 className="text-4xl font-bold text-center mb-6 text-gray-800">👋 Вход / Регистрация</h2>
              <p className="text-center text-xl text-gray-600 mb-8 leading-relaxed">
                Раздел находится в разработке. Здесь будет форма входа и регистрации участников.
              </p>
              <Button className="w-full bg-secondary hover:bg-yellow-400 text-black text-xl font-bold py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105" size="lg">
                ⏳ Скоро появится
              </Button>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t-4 border-blue-200 bg-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img 
              src="https://cdn.poehali.dev/files/c8bb0d3f-5d90-41d-9d7a-9232853e0511.png" 
              alt="Мир Шахмат" 
              className="h-16 w-auto"
            />
          </div>
          <p className="text-lg text-gray-600 font-medium">
            © 2024 Мир Шахмат. Центр поддержки детского шахматного спорта
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;