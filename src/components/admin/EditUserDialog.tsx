import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

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
  balance?: number;
}

interface EditUserDialogProps {
  user: User | null;
  saving: boolean;
  onClose: () => void;
  onSave: (newPassword?: string) => void;
  onChange: (user: User) => void;
}

const EditUserDialog = ({
  user,
  saving,
  onClose,
  onSave,
  onChange,
}: EditUserDialogProps) => {
  const [newPassword, setNewPassword] = useState("");
  
  const handleSave = () => {
    onSave(newPassword || undefined);
    setNewPassword("");
  };
  
  return (
    <Dialog open={!!user} onOpenChange={() => { setNewPassword(""); onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование пользователя</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div>
                <Label>Имя</Label>
                <Input
                  value={user.full_name || ""}
                  onChange={(e) =>
                    onChange({
                      ...user,
                      full_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Фамилия</Label>
                <Input
                  value={user.last_name || ""}
                  onChange={(e) =>
                    onChange({
                      ...user,
                      last_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Отчество</Label>
                <Input
                  value={user.middle_name || ""}
                  onChange={(e) =>
                    onChange({
                      ...user,
                      middle_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Дата рождения</Label>
                <Input
                  type="date"
                  value={user.birth_date || ""}
                  onChange={(e) =>
                    onChange({
                      ...user,
                      birth_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>ID ФШР</Label>
                <Input
                  value={user.fsr_id || ""}
                  onChange={(e) =>
                    onChange({ ...user, fsr_id: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Учебное заведение</Label>
                <Input
                  value={user.education_institution || ""}
                  onChange={(e) =>
                    onChange({
                      ...user,
                      education_institution: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Тренер</Label>
                <Input
                  value={user.coach || ""}
                  onChange={(e) =>
                    onChange({ ...user, coach: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Город/Страна</Label>
                <Input
                  value={user.city_country || ""}
                  onChange={(e) =>
                    onChange({
                      ...user,
                      city_country: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Телефон представителя</Label>
                <Input
                  value={user.representative_phone || ""}
                  onChange={(e) =>
                    onChange({
                      ...user,
                      representative_phone: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Баланс (₽)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={user.balance || 0}
                  onChange={(e) =>
                    onChange({
                      ...user,
                      balance: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Новый пароль (оставьте пустым, чтобы не менять)</Label>
                <Input
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.is_verified}
                  onCheckedChange={(checked) =>
                    onChange({ ...user, is_verified: checked })
                  }
                />
                <Label>Email подтвержден</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.is_admin}
                  onCheckedChange={(checked) =>
                    onChange({ ...user, is_admin: checked })
                  }
                />
                <Label>Права администратора</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Save" className="mr-2" size={16} />
                    Сохранить
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;