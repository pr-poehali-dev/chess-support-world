import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

interface AuthFormProps {
  onSuccess?: (user: any) => void;
}

const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('verify');
    
    if (verifyToken) {
      setVerifying(true);
      fetch(`${func2url['auth-verify']}?token=${verifyToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMessage({ type: 'success', text: data.message });
            setMode('login');
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            setMessage({ type: 'error', text: data.error });
          }
          setVerifying(false);
        })
        .catch(() => {
          setMessage({ type: 'error', text: 'Ошибка при подтверждении email' });
          setVerifying(false);
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'register') {
        const response = await fetch(func2url['auth-register'], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setMessage({ type: 'success', text: data.message });
          setEmail('');
          setPassword('');
          setFullName('');
          setTimeout(() => setMode('login'), 3000);
        } else {
          setMessage({ type: 'error', text: data.error || 'Ошибка регистрации' });
        }
      } else {
        const response = await fetch(func2url['auth-login'], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setMessage({ type: 'success', text: 'Успешный вход!' });
          
          if (onSuccess) {
            onSuccess(data.user);
          }
        } else {
          setMessage({ type: 'error', text: data.error || 'Ошибка входа' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Card className="p-8 bg-white max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon name="Mail" size={32} className="text-blue-600" />
          </div>
          <p className="text-gray-600">Проверяем ваш email...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 bg-white max-w-md mx-auto">
      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Icon name="LogIn" size={32} className="text-blue-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">
        {mode === 'login' ? 'Вход' : 'Регистрация'}
      </h2>

      {message && (
        <div className={`p-4 rounded-lg mb-4 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите ваше имя"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Минимум 6 символов"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-secondary hover:bg-secondary/90 text-black" 
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Icon name="Loader2" className="animate-spin" size={20} />
              Загрузка...
            </span>
          ) : (
            mode === 'login' ? 'Войти' : 'Зарегистрироваться'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setMessage(null);
          }}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {mode === 'login' 
            ? 'Нет аккаунта? Зарегистрируйтесь' 
            : 'Уже есть аккаунт? Войдите'
          }
        </button>
      </div>
    </Card>
  );
};

export default AuthForm;
