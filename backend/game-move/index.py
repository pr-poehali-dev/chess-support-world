'''
Business: Make a move in online chess game
Args: event with httpMethod, body (game_id, move), headers (X-User-Id); context with request_id
Returns: HTTP response with updated game state
'''

import json
import psycopg2
import os
from typing import Dict, Any

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
        FROM games
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
            UPDATE games
            SET black_player_id = %s, status = 'active', updated_at = NOW()
            WHERE id = %s
        """, (user_id_int, game_id))
        conn.commit()
    
    cursor.execute("""
        UPDATE games
        SET fen = %s, pgn = %s, current_turn = %s, status = %s, winner = %s, updated_at = NOW()
        WHERE id = %s
    """, (fen, pgn or '', current_turn, status, winner, game_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }
