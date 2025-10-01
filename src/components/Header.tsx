import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface HeaderProps {
  user: any;
  onUserChange?: (user: any) => void;
}

const Header = ({ user, onUserChange }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'home', label: 'Главная', icon: 'Home', path: '/' },
    { id: 'tournaments', label: 'Турниры', icon: 'Trophy', path: '/?section=tournaments' },
    { id: 'results', label: 'Результаты', icon: 'Award', path: '/?section=results' },
    { id: 'awards', label: 'Награды', icon: 'Medal', path: '/?section=awards' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUserMenuOpen(false);
    if (onUserChange) {
      onUserChange(null);
    }
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из системы"
    });
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' && !location.search;
    return location.pathname + location.search === path;
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <img 
              src="https://cdn.poehali.dev/files/c8bb0d3f-5d90-41d2-9d7a-9232853e0511.png" 
              alt="Мир Шахмат" 
              className="h-16 w-auto"
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={isActive(item.path) ? 'default' : 'ghost'}
                onClick={() => navigate(item.path)}
                className={`gap-2 transition-all ${
                  isActive(item.path)
                    ? 'bg-secondary text-black hover:bg-secondary/90' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon name={item.icon as any} size={18} />
                <span className="font-medium">{item.label}</span>
              </Button>
            ))}
            
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="gap-2 hover:bg-gray-100"
                >
                  <Icon name="User" size={18} />
                  <span className="font-medium">{user.full_name || 'Профиль'}</span>
                  <Icon name="ChevronDown" size={16} className={`transition-transform ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`} />
                </Button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Icon name="User" size={16} />
                      Профиль
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
                    >
                      <Icon name="LogOut" size={16} />
                      Выход
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => navigate('/?section=auth')}
                className="gap-2 hover:bg-gray-100"
              >
                <Icon name="LogIn" size={18} />
                <span className="font-medium">Вход</span>
              </Button>
            )}
          </nav>

          <button className="md:hidden p-2 hover:bg-gray-100 rounded">
            <Icon name="Menu" size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
