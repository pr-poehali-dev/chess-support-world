import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface DeleteUserDialogProps {
  user: User | null;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteUserDialog = ({
  user,
  deleting,
  onClose,
  onDelete,
}: DeleteUserDialogProps) => {
  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удаление пользователя</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Вы уверены, что хотите удалить пользователя{" "}
              <strong>{user.email}</strong>?
            </p>
            <p className="text-sm text-red-600">
              Это действие нельзя отменить. Все данные пользователя будут удалены.
            </p>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={onDelete}
                disabled={deleting}
                variant="destructive"
                className="flex-1"
              >
                {deleting ? (
                  <>
                    <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                    Удаление...
                  </>
                ) : (
                  <>
                    <Icon name="Trash2" className="mr-2" size={16} />
                    Удалить
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={deleting}
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

export default DeleteUserDialog;
