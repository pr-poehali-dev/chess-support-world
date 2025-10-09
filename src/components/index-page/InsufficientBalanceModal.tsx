import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface InsufficientBalanceModalProps {
  open: boolean;
  required: number;
  current: number;
  onTopUp: (amount: string) => void;
  onClose: () => void;
}

const InsufficientBalanceModal = ({
  open,
  required,
  current,
  onTopUp,
  onClose
}: InsufficientBalanceModalProps) => {
  if (!open) return null;

  const deficit = (required - current).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="AlertCircle" size={40} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Недостаточно средств
          </h2>
          <p className="text-gray-600">
            Для участия в турнире необходимо пополнить баланс
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Необходимо:</span>
            <span className="text-xl font-bold text-gray-900">
              {required} ₽
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">На балансе:</span>
            <span className="text-xl font-bold text-red-600">
              {current} ₽
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Не хватает:</span>
              <span className="text-2xl font-bold text-orange-600">
                {deficit} ₽
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => {
              onTopUp(deficit);
              onClose();
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 gap-2 py-6 text-lg"
          >
            <Icon name="Wallet" size={20} />
            Пополнить баланс
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InsufficientBalanceModal;
