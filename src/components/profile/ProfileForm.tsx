import Icon from '@/components/ui/icon';

interface ProfileFormProps {
  user: any;
  editing: boolean;
  fullName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  fsrId: string;
  educationInstitution: string;
  coach: string;
  msRating: string;
  cityCountry: string;
  representativePhone: string;
  email: string;
  newPassword: string;
  onFullNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onMiddleNameChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onFsrIdChange: (value: string) => void;
  onEducationInstitutionChange: (value: string) => void;
  onCoachChange: (value: string) => void;
  onMsRatingChange: (value: string) => void;
  onCityCountryChange: (value: string) => void;
  onRepresentativePhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
}

export default function ProfileForm({
  user,
  editing,
  fullName,
  lastName,
  middleName,
  birthDate,
  fsrId,
  educationInstitution,
  coach,
  msRating,
  cityCountry,
  representativePhone,
  email,
  newPassword,
  onFullNameChange,
  onLastNameChange,
  onMiddleNameChange,
  onBirthDateChange,
  onFsrIdChange,
  onEducationInstitutionChange,
  onCoachChange,
  onMsRatingChange,
  onCityCountryChange,
  onRepresentativePhoneChange,
  onEmailChange,
  onNewPasswordChange
}: ProfileFormProps) {
  return (
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
                onChange={(e) => onLastNameChange(e.target.value)}
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
                onChange={(e) => onFullNameChange(e.target.value)}
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
                onChange={(e) => onMiddleNameChange(e.target.value)}
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
                onChange={(e) => onBirthDateChange(e.target.value)}
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
                onChange={(e) => onFsrIdChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Введите ваш ID ФШР"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.fsr_id || 'Не указано'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Учебное заведение
            </label>
            {editing ? (
              <input
                type="text"
                value={educationInstitution}
                onChange={(e) => onEducationInstitutionChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Школа / университет"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.education_institution || 'Не указано'}</p>
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
                onChange={(e) => onCoachChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="ФИО тренера"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.coach || 'Не указано'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Рейтинг МС
            </label>
            {editing ? (
              <input
                type="number"
                value={msRating}
                onChange={(e) => onMsRatingChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Например: 2000"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.ms_rating || 'Не указано'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Контакты */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
          <Icon name="MapPin" size={16} />
          Контактная информация
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Город / Страна
            </label>
            {editing ? (
              <input
                type="text"
                value={cityCountry}
                onChange={(e) => onCityCountryChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Например: Москва, Россия"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.city_country || 'Не указано'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Телефон представителя
            </label>
            {editing ? (
              <input
                type="tel"
                value={representativePhone}
                onChange={(e) => onRepresentativePhoneChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="+7 (999) 123-45-67"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.representative_phone || 'Не указано'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Безопасность */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <Icon name="Lock" size={16} />
          Безопасность
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="your@email.com"
              />
            ) : (
              <p className="text-sm text-gray-900">{user.email || 'Не указано'}</p>
            )}
          </div>

          {editing && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Оставьте пустым, если не хотите менять"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
