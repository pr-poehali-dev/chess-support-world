'''
Business: Get chess game state by ID
Args: event with httpMethod, queryStringParameters (game_id); context with request_id
Returns: HTTP response with game state (fen, pgn, players, status)
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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не разрешен'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {})
    game_id = params.get('game_id')
    
    if not game_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не указан game_id'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT g.id, g.fen, g.pgn, g.white_player_id, g.black_player_id, 
               g.current_turn, g.status, g.winner,
               w.full_name as white_name, b.full_name as black_name
        FROM games g
        LEFT JOIN users w ON g.white_player_id = w.id
        LEFT JOIN users b ON g.black_player_id = b.id
        WHERE g.id = %s
    """, (game_id,))
    
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not row:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Игра не найдена'}),
            'isBase64Encoded': False
        }
    
    game_data = {
        'id': row[0],
        'fen': row[1],
        'pgn': row[2],
        'white_player_id': row[3],
        'black_player_id': row[4],
        'current_turn': row[5],
        'status': row[6],
        'winner': row[7],
        'white_player_name': row[8],
        'black_player_name': row[9]
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'game': game_data}),
        'isBase64Encoded': False
    }
