export interface Tournament {
  id: number;
  title: string;
  description: string;
  start_date: string | null;
  start_time: string | null;
  location: string;
  max_participants: number | null;
  time_control: string | null;
  tournament_type: 'blitz' | 'rapid' | null;
  entry_fee: number | null;
  status: 'draft' | 'registration_open' | 'in_progress' | 'finished';
  created_at: string;
  updated_at: string;
}

export const statusLabels = {
  draft: 'Черновик',
  registration_open: 'Идет прием заявок',
  in_progress: 'Идет сейчас',
  finished: 'Окончен'
};

export const statusConfig = {
  draft: {
    label: 'Черновик',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    card: 'border-l-4 border-l-gray-400 bg-gradient-to-r from-gray-50 to-white',
    icon: 'FileText',
    iconColor: 'text-gray-500'
  },
  registration_open: {
    label: 'Идет прием заявок',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-400',
    card: 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white shadow-emerald-100 shadow-md',
    icon: 'UserPlus',
    iconColor: 'text-emerald-600'
  },
  in_progress: {
    label: 'Идет сейчас',
    badge: 'bg-blue-100 text-blue-800 border-blue-400',
    card: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-blue-100 shadow-md',
    icon: 'Trophy',
    iconColor: 'text-blue-600'
  },
  finished: {
    label: 'Окончен',
    badge: 'bg-purple-100 text-purple-800 border-purple-400',
    card: 'border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 to-white',
    icon: 'Crown',
    iconColor: 'text-purple-600'
  }
};
