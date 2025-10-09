import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface News {
  id: number;
  title: string;
  content: string;
  iconName: string;
  iconColor: string;
  publishedDate: string;
  imageUrl?: string;
}

interface NewsDialogProps {
  open: boolean;
  news: News | null;
  onOpenChange: (open: boolean) => void;
}

const NewsDialog = ({ open, news, onOpenChange }: NewsDialogProps) => {
  if (!news) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{news.title}</DialogTitle>
        </DialogHeader>
        
        {news.imageUrl && (
          <div className="-mx-6 -mt-4 mb-4">
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className={`w-10 h-10 bg-${news.iconColor}-100 rounded-lg flex items-center justify-center`}>
              <Icon name={news.iconName} size={20} className={`text-${news.iconColor}-600`} />
            </div>
            <span>
              {new Date(news.publishedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {news.content}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsDialog;
