import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Tournament, statusConfig } from './types';

interface TournamentCardProps {
  tournament: Tournament;
  onEdit: (tournament: Tournament) => void;
  onDelete: (id: number) => void;
  onViewParticipants: (tournament: Tournament) => void;
}

const TournamentCard = ({ tournament