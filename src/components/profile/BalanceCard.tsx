import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BalanceCardProps {
  balance: number;
  onTopUpClick: () => void;
}

export default function BalanceCard({ balance, onTopUpClick }: BalanceCardProps) {
  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Баланс</h3>
          <p className="text-3xl font-bold text-green-700">
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(balance || 0)}
          </p>
        </div>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Icon name="Wallet" size={24} className="text-green-600" />
        </div>
      </div>
      <Button
        onClick={onTopUpClick}
        className="w-full bg-green-600 hover:bg-green-700 gap-2"
      >
        <Icon name="Plus" size={18} />
        Пополнить баланс
      </Button>
    </div>
  );
}
