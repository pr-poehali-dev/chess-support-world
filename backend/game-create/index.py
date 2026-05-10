'''
Business: Create new online chess game with optional time control
Args: event with httpMethod, headers (X-User-Id), body (time_control); context with request_id
Returns: HTTP response with game_id and join link
'''

import json
import psycopg2
import os
import uuid
from typing import Dict, Any

def parse_time_control(time_control: str) -> int:
    """Парсит строку вида '5+3' и возвращает начальное время в секундах"""
    if not time_control:
        return 0
    try:
        parts = time_control.split('+')
        minutes = int(parts[0])
        return minutes * 60
    except Exception:
        return 0

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
    
    body_data = json.loads(event.get('body') or '{}')
    time_control = body_data.get('time_control')  # например "5+3"
    
    initial_time = parse_time_control(time_control) if time_control else None
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    game_id = str(uuid.uuid4())
    initial_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    
    cursor.execute("SELECT id FROM users WHERE id = %s", (int(user_id),))
    user_exists = cursor.fetchone()
    
    white_id = int(user_id) if user_exists else None
    
    cursor.execute("""
        INSERT INTO games (id, fen, pgn, white_player_id, current_turn, status, time_control, white_time, black_time)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (game_id, initial_fen, '', white_id, 'w', 'waiting', time_control, initial_time, initial_time))
    
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