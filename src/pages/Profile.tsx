import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import func2url from '../../backend/func2url.json';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для доступа к профилю",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFullName(parsedUser.full_name || '');
    setEmail(parsedUser.email || '');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из системы"
    });
    navigate('/');
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(func2url['profile-update'], {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({ 
          full_name: fullName,
          email,
          password: newPassword || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedUser = { ...user, full_name: fullName, email };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast({
          title: "Профиль обновлен",
          description: "Изменения успешно сохранены"
        });
        
        setEditing(false);
        setNewPassword('');
      } else {
        toast({
          title: "Ошибка",
          description: data.error || 'Не удалось обновить профиль',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка соединения с сервером",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Icon name="ArrowLeft" size={18} />
              На главную
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2"
            >
              <Icon name="LogOut" size={18} />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto p-8 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Icon name="User" size={40} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
                <p className="text-gray-600">Управление профилем</p>
              </div>
            </div>

            {!editing && (
              <Button 
                onClick={() => setEditing(true)}
                className="gap-2"
              >
                <Icon name="Edit" size={18} />
                Редактировать
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Полное имя
              </label>
              {editing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите ваше имя"
                />
              ) : (
                <p className="text-lg text-gray-900">{user.full_name || 'Не указано'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-lg text-gray-900">{user.email}</p>
                  {user.is_verified && (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
                      <Icon name="CheckCircle" size={14} />
                      Подтверждён
                    </div>
                  )}
                </div>
              )}
            </div>

            {editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Новый пароль (оставьте пустым, если не хотите менять)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Минимум 6 символов"
                  minLength={6}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID пользователя
              </label>
              <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                {user.id}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата регистрации
              </label>
              <p className="text-lg text-gray-900">
                {new Date(user.created_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {editing && (
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" className="animate-spin" size={18} />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Icon name="Save" size={18} />
                      Сохранить
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFullName(user.full_name || '');
                    setEmail(user.email || '');
                    setNewPassword('');
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
