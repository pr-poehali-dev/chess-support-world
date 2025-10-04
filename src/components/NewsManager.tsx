import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  iconName: string;
  iconColor: string;
  publishedDate: string;
  isPublished: boolean;
}

const NewsManager = () => {
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    iconName: 'Newspaper',
    iconColor: 'blue',
    publishedDate: new Date().toISOString().split('T')[0],
    isPublished: true,
  });

  const iconOptions = [
    { value: 'Newspaper', label: 'Газета' },
    { value: 'Trophy', label: 'Кубок' },
    { value: 'Medal', label: 'Медаль' },
    { value: 'Award', label: 'Награда' },
    { value: 'Star', label: 'Звезда' },
    { value: 'Calendar', label: 'Календарь' },
  ];

  const colorOptions = [
    { value: 'blue', label: 'Синий' },
    { value: 'yellow', label: 'Желтый' },
    { value: 'green', label: 'Зеленый' },
    { value: 'red', label: 'Красный' },
    { value: 'purple', label: 'Фиолетовый' },
  ];

  const loadNews = async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return;
    
    const user = JSON.parse(userStr);
    
    try {
      const response = await fetch(
        'https://functions.poehali.dev/6ed83f3f-f0d8-4f62-9683-b62115f997be',
        {
          method: 'GET',
          headers: {
            'X-User-Id': user.id.toString(),
          },
        }
      );
      
      const data = await response.json();
      
      if (data.news) {
        setNews(data.news);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить новости',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleSubmit = async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return;
    
    const user = JSON.parse(userStr);
    
    try {
      const method = editingNews ? 'PUT' : 'POST';
      const body = editingNews
        ? { ...formData, id: editingNews.id }
        : formData;
      
      const response = await fetch(
        'https://functions.poehali.dev/6ed83f3f-f0d8-4f62-9683-b62115f997be',
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString(),
          },
          body: JSON.stringify(body),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: editingNews
            ? 'Новость обновлена'
            : 'Новость создана',
        });
        setDialogOpen(false);
        setEditingNews(null);
        setFormData({
          title: '',
          content: '',
          iconName: 'Newspaper',
          iconColor: 'blue',
          publishedDate: new Date().toISOString().split('T')[0],
          isPublished: true,
        });
        loadNews();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить новость',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту новость?')) return;
    
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return;
    
    const user = JSON.parse(userStr);
    
    try {
      const response = await fetch(
        `https://functions.poehali.dev/6ed83f3f-f0d8-4f62-9683-b62115f997be?id=${id}`,
        {
          method: 'DELETE',
          headers: {
            'X-User-Id': user.id.toString(),
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Новость удалена',
        });
        loadNews();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить новость',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      content: item.content,
      iconName: item.iconName,
      iconColor: item.iconColor,
      publishedDate: item.publishedDate,
      isPublished: item.isPublished,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingNews(null);
    setFormData({
      title: '',
      content: '',
      iconName: 'Newspaper',
      iconColor: 'blue',
      publishedDate: new Date().toISOString().split('T')[0],
      isPublished: true,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-chess-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-chess-dark">Управление новостями</h2>
          <p className="text-gray-600">Создавайте и редактируйте новости для главной страницы</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Icon name="Plus" size={20} />
          Добавить новость
        </Button>
      </div>

      <div className="grid gap-4">
        {news.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 bg-${item.iconColor}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon name={item.iconName} size={24} className={`text-${item.iconColor}-600`} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{item.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{new Date(item.publishedDate).toLocaleDateString('ru-RU')}</span>
                      <span className={item.isPublished ? 'text-green-600' : 'text-red-600'}>
                        {item.isPublished ? 'Опубликовано' : 'Черновик'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {news.length === 0 && (
          <Card className="p-12 text-center">
            <Icon name="Newspaper" size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Новостей пока нет</p>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNews ? 'Редактировать новость' : 'Новая новость'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Заголовок</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Название новости"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Содержание</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Текст новости"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Иконка</label>
                <Select
                  value={formData.iconName}
                  onValueChange={(value) => setFormData({ ...formData, iconName: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Цвет</label>
                <Select
                  value={formData.iconColor}
                  onValueChange={(value) => setFormData({ ...formData, iconColor: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Дата публикации</label>
              <Input
                type="date"
                value={formData.publishedDate}
                onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isPublished" className="text-sm font-medium">
                Опубликовать сразу
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>
              {editingNews ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManager;
