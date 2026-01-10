'''
Business: Make a move in online chess game
Args: event with httpMethod, body (game_id, move), headers (X-User-Id); context with request_id
Returns: HTTP response with updated game state
'''

import json
import psycopg2
import os
from typing import Dict, Any
import urllib.request

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не разрешен'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не авторизован'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    game_id = body_data.get('game_id')
    fen = body_data.get('fen')
    pgn = body_data.get('pgn')
    current_turn = body_data.get('current_turn')
    status = body_data.get('status', 'active')
    winner = body_data.get('winner')
    
    if not game_id or not fen:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не указаны game_id или fen'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT white_player_id, black_player_id, status
        FROM t_p91748136_chess_support_world.games
        WHERE id = %s
    """, (game_id,))
    
    row = cursor.fetchone()
    
    if not row:
        cursor.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Игра не найдена'}),
            'isBase64Encoded': False
        }
    
    white_id, black_id, game_status = row
    user_id_int = int(user_id)
    
    if game_status == 'waiting' and black_id is None and user_id_int != white_id:
        cursor.execute("""
            UPDATE t_p91748136_chess_support_world.games
            SET black_player_id = %s, status = 'active', updated_at = NOW()
            WHERE id = %s
        """, (user_id_int, game_id))
        conn.commit()
    
    cursor.execute("""
        UPDATE t_p91748136_chess_support_world.games
        SET fen = %s, pgn = %s, current_turn = %s, status = %s, winner = %s, updated_at = NOW()
        WHERE id = %s
    """, (fen, pgn or '', current_turn, status, winner, game_id))
    
    cursor.execute("""
        SELECT tournament_id FROM t_p91748136_chess_support_world.games WHERE id = %s
    """, (game_id,))
    
    tournament_row = cursor.fetchone()
    tournament_id = tournament_row[0] if tournament_row else None
    
    conn.commit()
    cursor.close()
    conn.close()
    
    if tournament_id and status in ['checkmate', 'stalemate', 'draw', 'resignation', 'timeout']:
        try:
            check_url = os.environ.get('TOURNAMENT_CHECK_URL', 'https://functions.poehali.dev/cb616011-7fdb-4eb7-8e58-948329b28419')
            check_data = json.dumps({'tournament_id': tournament_id}).encode('utf-8')
            check_req = urllib.request.Request(check_url, data=check_data, headers={'Content-Type': 'application/json'}, method='POST')
            with urllib.request.urlopen(check_req) as response:
                check_result = json.loads(response.read().decode('utf-8'))
                
                if check_result.get('round_finished') and not check_result.get('tournament_finished'):
                    auto_next_url = os.environ.get('TOURNAMENT_AUTO_NEXT_URL', 'https://functions.poehali.dev/tournament-auto-next')
                    auto_next_data = json.dumps({'tournament_id': tournament_id}).encode('utf-8')
                    auto_next_req = urllib.request.Request(auto_next_url, data=auto_next_data, headers={'Content-Type': 'application/json'}, method='POST')
                    urllib.request.urlopen(auto_next_req)
        except Exception:
            pass
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }