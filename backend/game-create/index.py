'''
Business: Create new online chess game
Args: event with httpMethod, headers (X-User-Id); context with request_id
Returns: HTTP response with game_id and join link
'''

import json
import psycopg2
import os
import uuid
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
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    game_id = str(uuid.uuid4())
    initial_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    
    cursor.execute("SELECT id FROM users WHERE id = %s", (int(user_id),))
    user_exists = cursor.fetchone()
    
    white_id = int(user_id) if user_exists else None
    
    cursor.execute("""
        INSERT INTO games (id, fen, pgn, white_player_id, current_turn, status)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (game_id, initial_fen, '', white_id, 'w', 'waiting'))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'game_id': game_id,
            'join_url': f'/online-chess/{game_id}'
        }),
        'isBase64Encoded': False
    }