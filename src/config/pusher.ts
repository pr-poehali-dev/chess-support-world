// Pusher configuration for frontend
export const PUSHER_CONFIG = {
  key: import.meta.env.VITE_PUSHER_KEY || '6565e7fe3776add566a0',
  cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'eu',
} as const;
