import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface TopUpModalProps {
  open: boolean;
  amount: string;
  onAmountChange: (amount: string) => void;
  onClose: () => void;
}

const TopUpModal = ({ open, amount, onAmountChange, onClose }: TopUpModalProps) => {
  if (!open) return null;

  const handleSubmit = () => {
    if (!amount || Number(amount) < 100) {
      toast({
        title: "Ошибка",
        description: "Минимальная сумма пополнения - 100 ₽",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Скоро будет доступно",
      description: "Функция пополнения баланса в разработке"
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icon name="Wallet" size={24} className="text-green-600" />
            Пополнение баланса
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сумма пополнения (₽)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Введите сумму"
            min="100"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {[500, 1000, 2000].map((presetAmount) => (
            <button
              key={presetAmount}
              onClick={() => onAmountChange(presetAmount.toString())}
              className="px-4 py-2 border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition-colors text-green-700 font-medium"
            >
              {presetAmount} ₽
            </button>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 gap-2 py-6 text-lg"
        >
          <Icon name="CreditCard" size={20} />
          Перейти к оплате
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Минимальная сумма пополнения — 100 ₽
        </p>
      </div>
    </div>
  );
};

export default TopUpModal;
