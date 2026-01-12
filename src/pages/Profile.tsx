import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import TopUpModal from '@/components/index-page/TopUpModal';
import ProfileHeader from '@/components/profile/ProfileHeader';
import BalanceCard from '@/components/profile/BalanceCard';
import ProfileForm from '@/components/profile/ProfileForm';
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

  const handleAvatarRemove = () => {
    setAvatar(null);
    setAvatarFile(null);
    toast({
      title: "Аватар удалён",
      description: "Сохраните изменения, чтобы применить"
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onUserChange={setUser} onTopUpClick={() => setTopUpModalOpen(true)} />

      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto p-8 bg-white">
          <ProfileHeader
            user={user}
            avatar={avatar}
            avatarFile={avatarFile}
            editing={editing}
            loading={loading}
            onEditClick={() => setEditing(true)}
            onSaveClick={handleSave}
            onBackClick={() => navigate('/')}
            onAvatarChange={setAvatarFile}
            onAvatarRemove={handleAvatarRemove}
          />

          <BalanceCard
            balance={user.balance}
            onTopUpClick={() => setTopUpModalOpen(true)}
          />

          <ProfileForm
            user={user}
            editing={editing}
            fullName={fullName}
            lastName={lastName}
            middleName={middleName}
            birthDate={birthDate}
            fsrId={fsrId}
            educationInstitution={educationInstitution}
            coach={coach}
            msRating={msRating}
            cityCountry={cityCountry}
            representativePhone={representativePhone}
            email={email}
            newPassword={newPassword}
            onFullNameChange={setFullName}
            onLastNameChange={setLastName}
            onMiddleNameChange={setMiddleName}
            onBirthDateChange={setBirthDate}
            onFsrIdChange={setFsrId}
            onEducationInstitutionChange={setEducationInstitution}
            onCoachChange={setCoach}
            onMsRatingChange={setMsRating}
            onCityCountryChange={setCityCountry}
            onRepresentativePhoneChange={setRepresentativePhone}
            onEmailChange={setEmail}
            onNewPasswordChange={setNewPassword}
          />
        </Card>
      </main>

      <TopUpModal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        userId={user.id}
        onSuccess={() => {
          setTopUpModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Profile;
