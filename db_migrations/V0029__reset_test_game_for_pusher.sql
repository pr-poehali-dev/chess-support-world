
-- Сбросить тестовую игру на начальную позицию для Ильи Мозжерина (id=10)
UPDATE t_p91748136_chess_support_world.games
SET 
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn = '',
  white_player_id = 10,
  black_player_id = 8,
  current_turn = 'w',
  status = 'active',
  winner = NULL,
  updated_at = NOW()
WHERE id = '2f37d4bf-6c76-4f61-afb9-6851b8bc691b';
