import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface User {
  id: number;
  email: string;
  full_name: string;
  last_name: string;
  middle_name: string;
  birth_date: string;
  fsr_id: string;
  education_institution: string;
  coach: string;
  city_country: string;
  representative_phone: string;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const UserCard = ({ user, onEdit, onDelete }: UserCardProps) => {
  return (
    <Card className="p-0 bg-white border-2 border-gray-200 hover:border-chess-gold/60 transition-all shadow-md">
      <div className="bg-chess-gold/10 px-4 py-2.5 border-b-2 border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-chess-gold/30 flex items-center justify-center">
            <Icon name="User" size={18} className="text-chess-dark" />
          </div>
          <div>
            <p className="font-bold text-base text-chess-dark">{user.email}</p>
            <p className="text-xs text-gray-600">
              ID: {user.id} • Регистрация:{" "}
              {new Date(user.created_at).toLocaleDateString("ru-RU")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            {user.is_verified && (
              <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                ✓ Подтвержден
              </span>
            )}
            {user.is_admin && (
              <span className="px-2.5 py-0.5 bg-chess-gold text-chess-dark text-xs font-medium rounded-full">
                ★ Админ
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(user)}
              size="sm"
              className="bg-chess-gold hover:bg-chess-gold/80 text-chess-dark"
            >
              <Icon name="Edit" size={14} className="mr-1.5" />
              Редактировать
            </Button>
            <Button
              onClick={() => onDelete(user)}
              size="sm"
              variant="destructive"
            >
              <Icon name="Trash2" size={14} className="mr-1.5" />
              Удалить
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            ФИО
          </p>
          <p className="text-sm font-semibold text-chess-dark">
            {user.last_name} {user.full_name} {user.middle_name || ""}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Дата рождения
          </p>
          <p className="text-sm font-semibold text-chess-dark">
            {user.birth_date
              ? new Date(user.birth_date).toLocaleDateString("ru-RU")
              : "Не указана"}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            ID ФШР
          </p>
          <p className="text-sm font-semibold text-chess-dark">
            {user.fsr_id || "Не указан"}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Учебное заведение
          </p>
          <p className="text-sm font-semibold text-chess-dark">
            {user.education_institution || "Не указано"}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Тренер
          </p>
          <p className="text-sm font-semibold text-chess-dark">
            {user.coach || "Не указан"}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Город/Страна
          </p>
          <p className="text-sm font-semibold text-chess-dark">
            {user.city_country || "Не указано"}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Телефон представителя
          </p>
          <p className="text-sm font-semibold text-chess-dark">
            {user.representative_phone || "Не указан"}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default UserCard;