import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
          <Card className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer">
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

          <Card className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chess-gold/20 rounded-lg">
                <Icon name="Bell" size={24} className="text-chess-dark" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-chess-dark mb-2">
                  Уведомления
                </h3>
                <p className="text-gray-600 text-sm">
                  Рассылки и объявления
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chess-gold/20 rounded-lg">
                <Icon name="Database" size={24} className="text-chess-dark" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-chess-dark mb-2">
                  База данных
                </h3>
                <p className="text-gray-600 text-sm">
                  Резервное копирование
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;