import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import NewsManager from "@/components/NewsManager";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        toast({
          title: "Требуется авторизация",
          description: "Пожалуйста, войдите в систему",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        const response = await fetch(
          "https://functions.poehali.dev/eca2e5eb-f266-4d23-85b9-37172d2bc017",
          {
            method: "GET",
            headers: {
              "X-Auth-Token": token,
            },
          }
        );

        const data = await response.json();

        if (data.success && data.user.is_admin) {
          setIsAdmin(true);
        } else {
          toast({
            title: "Доступ запрещен",
            description: "У вас нет прав администратора",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось проверить права доступа",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Icon name="Loader2" size={48} className="text-chess-gold" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chess-dark via-chess-blue to-chess-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-chess-gold mb-2">
              Панель администратора
            </h1>
            <p className="text-white/80">
              Управление системой «Мир Шахмат»
            </p>
          </div>
          <Button
            onClick={() => navigate("/profile")}
            variant="outline"
            className="border-chess-gold text-chess-gold hover:bg-chess-gold/10"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer"
            onClick={() => navigate('/admin/users')}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chess-gold/20 rounded-lg">
                <Icon name="Users" size={24} className="text-chess-dark" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-chess-dark mb-2">
                  Пользователи
                </h3>
                <p className="text-gray-600 text-sm">
                  Управление учетными записями
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chess-gold/20 rounded-lg">
                <Icon name="Calendar" size={24} className="text-chess-dark" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-chess-dark mb-2">
                  Турниры
                </h3>
                <p className="text-gray-600 text-sm">
                  Создание и редактирование турниров
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chess-gold/20 rounded-lg">
                <Icon name="FileText" size={24} className="text-chess-dark" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-chess-dark mb-2">
                  Отчеты
                </h3>
                <p className="text-gray-600 text-sm">
                  Статистика и аналитика
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chess-gold/20 rounded-lg">
                <Icon name="Settings" size={24} className="text-chess-dark" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-chess-dark mb-2">
                  Настройки
                </h3>
                <p className="text-gray-600 text-sm">
                  Конфигурация системы
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer"
            onClick={() => setShowNews(!showNews)}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chess-gold/20 rounded-lg">
                <Icon name="Newspaper" size={24} className="text-chess-dark" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-chess-dark mb-2">
                  Новости
                </h3>
                <p className="text-gray-600 text-sm">
                  Управление новостями на главной
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer"
            onClick={async () => {
              setShowDatabase(!showDatabase);
              if (!showDatabase && !dbStats) {
                setLoadingStats(true);
                try {
                  const token = localStorage.getItem('auth_token');
                  const response = await fetch('https://functions.poehali.dev/aeab7801-bfaa-47b9-afe9-34c3995d7c1d', {
                    headers: { 'X-Auth-Token': token || '' }
                  });
                  const data = await response.json();
                  if (data.success) {
                    setDbStats(data.stats);
                  }
                } catch (error) {
                  console.error('Error loading DB stats:', error);
                }
                setLoadingStats(false);
              }
            }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chess-gold/20 rounded-lg">
                <Icon name="Database" size={24} className="text-chess-dark" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-chess-dark mb-2">
                  База данных
                </h3>
                <p className="text-gray-600 text-sm">
                  Статистика и информация
                </p>
              </div>
            </div>
          </Card>
        </div>

        {showNews && (
          <Card className="mt-6 p-6 bg-white/95 border-chess-gold/30">
            <NewsManager />
          </Card>
        )}

        {showDatabase && (
          <Card className="mt-6 p-6 bg-white/95 border-chess-gold/30">
            <div className="flex items-center gap-3 mb-6">
              <Icon name="Database" size={28} className="text-chess-gold" />
              <h2 className="text-2xl font-bold text-chess-dark">База данных</h2>
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader2" size={32} className="animate-spin text-chess-gold" />
              </div>
            ) : dbStats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Users" size={20} className="text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Пользователи</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{dbStats.users || 0}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Key" size={20} className="text-green-600" />
                      <h3 className="font-semibold text-green-900">Токены авторизации</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{dbStats.auth_tokens || 0}</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Mail" size={20} className="text-purple-600" />
                      <h3 className="font-semibold text-purple-900">Верификации email</h3>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{dbStats.email_verifications || 0}</p>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="ShieldCheck" size={20} className="text-amber-600" />
                      <h3 className="font-semibold text-amber-900">Токены верификации</h3>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{dbStats.verification_tokens || 0}</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-chess-dark mb-4 flex items-center gap-2">
                    <Icon name="Table" size={20} />
                    Таблицы базы данных
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="font-mono text-sm text-gray-700">users</p>
                      <p className="text-xs text-gray-500 mt-1">Основная информация пользователей</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="font-mono text-sm text-gray-700">auth_tokens</p>
                      <p className="text-xs text-gray-500 mt-1">Токены для авторизации</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="font-mono text-sm text-gray-700">email_verifications</p>
                      <p className="text-xs text-gray-500 mt-1">История подтверждений email</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="font-mono text-sm text-gray-700">verification_tokens</p>
                      <p className="text-xs text-gray-500 mt-1">Токены для верификации email</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icon name="Database" size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Не удалось загрузить статистику базы данных</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;