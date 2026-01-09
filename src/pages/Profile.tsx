import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import TopUpModal from '@/components/index-page/TopUpModal';
import func2url from '../../backend/func2url.json';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [fsrId, setFsrId] = useState('');
  const [educationInstitution, setEducationInstitution] = useState('');
  const [coach, setCoach] = useState('');
  const [msRating, setMsRating] = useState('');
  const [cityCountry, setCityCountry] = useState('');
  const [representativePhone, setRepresentativePhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        toast({
          title: "Требуется авторизация",
          description: "Войдите в систему для доступа к профилю",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        const response = await fetch(func2url['profile-get'], {
          method: 'GET',
          headers: {
            'X-Auth-Token': token
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const userData = data.user;
          setUser(userData);
          setFullName(userData.full_name || '');
          setLastName(userData.last_name || '');
          setMiddleName(userData.middle_name || '');
          setBirthDate(userData.birth_date || '');
          setFsrId(userData.fsr_id || '');
          setEducationInstitution(userData.education_institution || '');
          setCoach(userData.coach || '');
          setMsRating(userData.ms_rating || '');
          setCityCountry(userData.city_country || '');
          setRepresentativePhone(userData.representative_phone || '');
          setEmail(userData.email || '');
          setAvatar(userData.avatar || null);
        } else {
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить данные профиля",
            variant: "destructive"
          });
          navigate('/');
        }
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Ошибка соединения с сервером",
          variant: "destructive"
        });
        navigate('/');
      }
    };

    loadUserData();
  }, [navigate]);



  const handleSave = async () => {
    setLoading(true);
    
    try {
      let avatarBase64 = avatar;
      
      if (avatarFile) {
        avatarBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(avatarFile);
        });
      }
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(func2url['profile-update'], {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({ 
          full_name: fullName,
          last_name: lastName,
          middle_name: middleName,
          birth_date: birthDate,
          fsr_id: fsrId,
          education_institution: educationInstitution,
          coach,
          ms_rating: msRating,
          city_country: cityCountry,
          representative_phone: representativePhone,
          email,
          password: newPassword || undefined,
          avatar: avatarBase64
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedUser = data.user;
        setUser(updatedUser);
        
        setFullName(updatedUser.full_name || '');
        setLastName(updatedUser.last_name || '');
        setMiddleName(updatedUser.middle_name || '');
        setBirthDate(updatedUser.birth_date || '');
        setFsrId(updatedUser.fsr_id || '');
        setEducationInstitution(updatedUser.education_institution || '');
        setCoach(updatedUser.coach || '');
        setMsRating(updatedUser.ms_rating || '');
        setCityCountry(updatedUser.city_country || '');
        setRepresentativePhone(updatedUser.representative_phone || '');
        setEmail(updatedUser.email || '');
        setAvatar(updatedUser.avatar || null);
        
        toast({
          title: "Профиль обновлен",
          description: "Изменения успешно сохранены"
        });
        
        setEditing(false);
        setNewPassword('');
        setAvatarFile(null);
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
      <Header user={user} onUserChange={setUser} onTopUpClick={() => setTopUpModalOpen(true)} />

      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto p-8 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div className="relative group">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  {avatar || avatarFile ? (
                    <img 
                      src={avatarFile ? URL.createObjectURL(avatarFile) : avatar!} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon name="User" size={40} className="text-blue-600" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Icon name="Camera" size={20} className="text-white" />
                  </button>
                  {(avatar || avatarFile) && (
                    <button
                      onClick={() => {
                        setAvatar(null);
                        setAvatarFile(null);
                        toast({
                          title: "Аватар удалён",
                          description: "Сохраните изменения, чтобы применить"
                        });
                      }}
                      className="p-2 bg-red-500/70 hover:bg-red-500/90 rounded-lg transition-colors"
                    >
                      <Icon name="Trash2" size={20} className="text-white" />
                    </button>
                  )}
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          title: "Файл слишком большой",
                          description: "Максимальный размер: 5 МБ",
                          variant: "destructive"
                        });
                        return;
                      }
                      setAvatarFile(file);
                      toast({
                        title: "Фото выбрано",
                        description: "Сохраните изменения, чтобы обновить аватар"
                      });
                    }
                  }}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
                <p className="text-gray-600">Управление профилем</p>
              </div>
            </div>

            <div className="flex gap-2">
              {!editing && (
                <Button 
                  onClick={() => setEditing(true)}
                  className="gap-2"
                >
                  <Icon name="Edit" size={18} />
                  Редактировать
                </Button>
              )}
              {(editing || avatarFile) && (
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="gap-2 bg-green-600 hover:bg-green-700"
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
              )}
            </div>
          </div>

          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Баланс</h3>
                <p className="text-3xl font-bold text-green-700">
                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(user.balance || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="Wallet" size={24} className="text-green-600" />
              </div>
            </div>
            <Button
              onClick={() => setTopUpModalOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700 gap-2"
            >
              <Icon name="Plus" size={18} />
              Пополнить баланс
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Личные данные */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Icon name="User" size={16} />
                Личные данные
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Фамилия <span className="text-red-500">*</span>
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Введите вашу фамилию"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{user.last_name || 'Не указано'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Имя <span className="text-red-500">*</span>
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Введите ваше имя"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{user.full_name || 'Не указано'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Отчество
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Введите ваше отчество"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{user.middle_name || 'Не указано'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Дата рождения <span className="text-red-500">*</span>
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {user.birth_date ? (
                        <>
                          {new Date(user.birth_date).toLocaleDateString('ru-RU')}
                          {' '}
                          <span className="text-gray-600 text-xs">
                            ({Math.floor((new Date().getTime() - new Date(user.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} лет)
                          </span>
                        </>
                      ) : 'Не указано'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Шахматная информация */}
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <Icon name="Trophy" size={16} />
                Шахматная информация
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ID ФШР
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={fsrId}
                      onChange={(e) => setFsrId(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Введите ваш ID ФШР"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{user.fsr_id || 'Не указано'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Тренер
                  </label>
                  {editing ? (
                    <input
                  type="text"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="ФИО тренера"
                />
              ) : (
                <p className="text-sm text-gray-900">{user.coach || 'Не указано'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Рейтинг МШ (Мир Шахмат)
              </label>
              {editing && user.is_admin ? (
                <input
                  type="number"
                  value={msRating}
                  onChange={(e) => setMsRating(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="Введите рейтинг МШ"
                />
              ) : (
                <p className="text-sm text-gray-900">{user.ms_rating || 'Не указано'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Образование и контакты */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Icon name="GraduationCap" size={16} />
            Образование и контакты
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Город/Страна
              </label>
              {editing ? (
                <input
                  type="text"
                  value={cityCountry}
                  onChange={(e) => setCityCountry(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="Город, Страна"
                />
              ) : (
                <p className="text-sm text-gray-900">{user.city_country || 'Не указано'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Учебное учреждение
              </label>
              {editing ? (
                <input
                  type="text"
                  value={educationInstitution}
                  onChange={(e) => setEducationInstitution(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="Название учебного учреждения"
                />
              ) : (
                <p className="text-sm text-gray-900">{user.education_institution || 'Не указано'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Номер телефона представителя
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={representativePhone}
                  onChange={(e) => setRepresentativePhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="+7 (999) 123-45-67"
                />
              ) : (
                <p className="text-sm text-gray-900">{user.representative_phone || 'Не указано'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Аккаунт */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <Icon name="Lock" size={16} />
            Безопасность аккаунта
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="your@email.com"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-900">{user.email}</p>
                  {user.is_verified && (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">
                      <Icon name="CheckCircle" size={12} />
                      Подтверждён
                    </div>
                  )}
                </div>
              )}
            </div>

            {editing && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Новый пароль (оставьте пустым, если не хотите менять)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="Минимум 6 символов"
                  minLength={6}
                />
              </div>
            )}
          </div>
        </div>

        {/* Системная информация */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Icon name="Info" size={16} />
            Системная информация
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ID пользователя
              </label>
              <p className="text-xs text-gray-500 font-mono bg-white p-1.5 rounded border border-gray-200">
                {user.id}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Дата регистрации
              </label>
              <p className="text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

            {user?.is_admin && (
              <div className="pt-4">
                <Button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-chess-gold text-black hover:bg-yellow-500 gap-2"
                >
                  <Icon name="Shield" size={18} />
                  Панель администратора
                </Button>
              </div>
            )}

            {editing && (
              <div className="pt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFullName(user.full_name || '');
                    setLastName(user.last_name || '');
                    setMiddleName(user.middle_name || '');
                    setBirthDate(user.birth_date || '');
                    setFsrId(user.fsr_id || '');
                    setEducationInstitution(user.education_institution || '');
                    setCoach(user.coach || '');
                    setCityCountry(user.city_country || '');
                    setRepresentativePhone(user.representative_phone || '');
                    setEmail(user.email || '');
                    setNewPassword('');
                    setAvatar(user.avatar || null);
                    setAvatarFile(null);
                  }}
                  disabled={loading}
                  className="w-full"
                >
                  <Icon name="X" size={18} className="mr-2" />
                  Отменить изменения
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>

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
    </div>
  );
};

export default Profile;