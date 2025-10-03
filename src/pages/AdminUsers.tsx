import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import func2url from "../../backend/func2url.json";
import UserCard from "@/components/admin/UserCard";
import EditUserDialog from "@/components/admin/EditUserDialog";
import DeleteUserDialog from "@/components/admin/DeleteUserDialog";

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
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [ageFilter, setAgeFilter] = useState<string>("all");

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

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const filteredUsers = users.filter((user) => {
    if (ageFilter === "all") return true;
    const age = calculateAge(user.birth_date);
    
    switch (ageFilter) {
      case "0-10":
        return age >= 0 && age <= 10;
      case "11-15":
        return age >= 11 && age <= 15;
      case "16-18":
        return age >= 16 && age <= 18;
      case "19-25":
        return age >= 19 && age <= 25;
      case "26+":
        return age >= 26;
      case "no-date":
        return !user.birth_date;
      default:
        return true;
    }
  });

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleting(true);
    const token = localStorage.getItem("auth_token");

    try {
      const response = await fetch(func2url["admin-user-delete"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token!,
        },
        body: JSON.stringify({
          user_id: deletingUser.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Успешно",
          description: "Пользователь удален",
        });
        setDeletingUser(null);
        await loadUsers();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось удалить пользователя",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

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
              Показано: {filteredUsers.length} из {users.length}
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

        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            onClick={() => setAgeFilter("all")}
            variant={ageFilter === "all" ? "default" : "outline"}
            size="sm"
            className={ageFilter === "all" ? "bg-chess-gold text-chess-dark" : "border-white/30 text-white hover:bg-white/10"}
          >
            Все возрасты
          </Button>
          <Button
            onClick={() => setAgeFilter("0-10")}
            variant={ageFilter === "0-10" ? "default" : "outline"}
            size="sm"
            className={ageFilter === "0-10" ? "bg-chess-gold text-chess-dark" : "border-white/30 text-white hover:bg-white/10"}
          >
            0-10 лет
          </Button>
          <Button
            onClick={() => setAgeFilter("11-15")}
            variant={ageFilter === "11-15" ? "default" : "outline"}
            size="sm"
            className={ageFilter === "11-15" ? "bg-chess-gold text-chess-dark" : "border-white/30 text-white hover:bg-white/10"}
          >
            11-15 лет
          </Button>
          <Button
            onClick={() => setAgeFilter("16-18")}
            variant={ageFilter === "16-18" ? "default" : "outline"}
            size="sm"
            className={ageFilter === "16-18" ? "bg-chess-gold text-chess-dark" : "border-white/30 text-white hover:bg-white/10"}
          >
            16-18 лет
          </Button>
          <Button
            onClick={() => setAgeFilter("19-25")}
            variant={ageFilter === "19-25" ? "default" : "outline"}
            size="sm"
            className={ageFilter === "19-25" ? "bg-chess-gold text-chess-dark" : "border-white/30 text-white hover:bg-white/10"}
          >
            19-25 лет
          </Button>
          <Button
            onClick={() => setAgeFilter("26+")}
            variant={ageFilter === "26+" ? "default" : "outline"}
            size="sm"
            className={ageFilter === "26+" ? "bg-chess-gold text-chess-dark" : "border-white/30 text-white hover:bg-white/10"}
          >
            26+ лет
          </Button>
          <Button
            onClick={() => setAgeFilter("no-date")}
            variant={ageFilter === "no-date" ? "default" : "outline"}
            size="sm"
            className={ageFilter === "no-date" ? "bg-chess-gold text-chess-dark" : "border-white/30 text-white hover:bg-white/10"}
          >
            Без даты рождения
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="UserX" size={48} className="mx-auto text-white/50 mb-4" />
              <p className="text-white/70 text-lg">Пользователи не найдены</p>
              <p className="text-white/50 text-sm mt-2">Попробуйте изменить фильтр</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={setEditingUser}
                onDelete={setDeletingUser}
              />
            ))
          )}
        </div>
      </div>

      <EditUserDialog
        user={editingUser}
        saving={saving}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
        onChange={setEditingUser}
      />

      <DeleteUserDialog
        user={deletingUser}
        deleting={deleting}
        onClose={() => setDeletingUser(null)}
        onDelete={handleDeleteUser}
      />
    </div>
  );
};

export default AdminUsers;