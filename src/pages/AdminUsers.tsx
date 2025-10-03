import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import func2url from "../../backend/func2url.json";

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

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/admin");
      return;
    }

    try {
      const response = await fetch(func2url["admin-users"], {
        method: "GET",
        headers: {
          "X-Auth-Token": token,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось загрузить пользователей",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setSaving(true);
    const token = localStorage.getItem("auth_token");

    try {
      const response = await fetch(func2url["admin-user-update"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token!,
        },
        body: JSON.stringify({
          user_id: editingUser.id,
          full_name: editingUser.full_name,
          last_name: editingUser.last_name,
          middle_name: editingUser.middle_name,
          birth_date: editingUser.birth_date,
          fsr_id: editingUser.fsr_id,
          education_institution: editingUser.education_institution,
          coach: editingUser.coach,
          city_country: editingUser.city_country,
          representative_phone: editingUser.representative_phone,
          is_verified: editingUser.is_verified,
          is_admin: editingUser.is_admin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Успешно",
          description: "Данные пользователя обновлены",
        });
        setEditingUser(null);
        loadUsers();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось обновить пользователя",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить пользователя",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-chess-dark via-chess-blue to-chess-dark">
        <div className="animate-spin">
          <Icon name="Loader2" size={48} className="text-chess-gold" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chess-dark via-chess-blue to-chess-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-chess-gold mb-2">
              Управление пользователями
            </h1>
            <p className="text-white/80">
              Всего пользователей: {users.length}
            </p>
          </div>
          <Button
            onClick={() => navigate("/admin")}
            variant="outline"
            className="border-chess-gold text-chess-gold hover:bg-chess-gold/10"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <Card
              key={user.id}
              className="p-6 bg-white/95 border-chess-gold/30 hover:border-chess-gold/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-chess-dark">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ФИО</p>
                    <p className="font-semibold text-chess-dark">
                      {user.full_name} {user.last_name} {user.middle_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Дата рождения</p>
                    <p className="font-semibold text-chess-dark">
                      {user.birth_date
                        ? new Date(user.birth_date).toLocaleDateString("ru-RU")
                        : "Не указана"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID ФШР</p>
                    <p className="font-semibold text-chess-dark">
                      {user.fsr_id || "Не указан"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Город/Страна</p>
                    <p className="font-semibold text-chess-dark">
                      {user.city_country || "Не указано"}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Статус</p>
                      <div className="flex gap-2 mt-1">
                        {user.is_verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            Подтвержден
                          </span>
                        )}
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-chess-gold/20 text-chess-dark text-xs rounded">
                            Админ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setEditingUser(user)}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <Icon name="Edit" size={16} className="mr-2" />
                  Редактировать
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
                </div>
                <div>
                  <Label>Имя</Label>
                  <Input
                    value={editingUser.full_name || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        full_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Фамилия</Label>
                  <Input
                    value={editingUser.last_name || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        last_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Отчество</Label>
                  <Input
                    value={editingUser.middle_name || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        middle_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Дата рождения</Label>
                  <Input
                    type="date"
                    value={editingUser.birth_date || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        birth_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>ID ФШР</Label>
                  <Input
                    value={editingUser.fsr_id || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, fsr_id: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Учебное заведение</Label>
                  <Input
                    value={editingUser.education_institution || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        education_institution: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Тренер</Label>
                  <Input
                    value={editingUser.coach || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, coach: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Город/Страна</Label>
                  <Input
                    value={editingUser.city_country || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        city_country: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Телефон представителя</Label>
                  <Input
                    value={editingUser.representative_phone || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        representative_phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingUser.is_verified}
                    onCheckedChange={(checked) =>
                      setEditingUser({ ...editingUser, is_verified: checked })
                    }
                  />
                  <Label>Email подтвержден</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingUser.is_admin}
                    onCheckedChange={(checked) =>
                      setEditingUser({ ...editingUser, is_admin: checked })
                    }
                  />
                  <Label>Права администратора</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveUser}
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
                  onClick={() => setEditingUser(null)}
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
    </div>
  );
};

export default AdminUsers;
