import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import FsrRatingSearch from '@/components/FsrRatingSearch';

interface News {
  id: number;
  title: string;
  preview: string;
  iconName: string;
  iconColor: string;
  publishedDate: string;
  imageUrl?: string;
}

interface HomeSectionProps {
  news: News[];
  user: any;
  onNavigateToTournaments: () => void;
  onNavigateToAuth: () => void;
  onNewsClick: (news: News) => void;
}

const HomeSection = ({ news, user, onNavigateToTournaments, onNavigateToAuth, onNewsClick }: HomeSectionProps) => {
  return (
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
            onClick={onNavigateToTournaments}
          >
            <Icon name="Trophy" size={20} />
            Турниры
          </Button>
          {!user && (
            <Button 
              size="lg" 
              variant="outline"
              onClick={onNavigateToAuth}
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
                        onClick={() => onNewsClick(item)}
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

        <div className="mb-8">
          <FsrRatingSearch />
        </div>

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
  );
};

export default HomeSection;
