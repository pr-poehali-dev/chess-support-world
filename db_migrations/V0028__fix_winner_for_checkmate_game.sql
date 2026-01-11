-- Fix winner field for checkmate game in tournament 14
UPDATE t_p91748136_chess_support_world.games 
SET winner = 'black'
WHERE id = '34c718d8-9fda-499e-8571-0e7d5c7e6e23' AND status = 'checkmate' AND current_turn = 'w';