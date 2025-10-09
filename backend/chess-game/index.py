'''
Business: Real-time chess game state management for tournament matches
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response with game state and move synchronization
'''

import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            game_id = params.get('game_id')
            
            if not game_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'game_id required'})
                }
            
            cur.execute('''
                SELECT id, white_player_id, black_player_id, fen, pgn, status, result
                FROM games
                WHERE id = %s
            ''', (game_id,))
            
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Game not found'})
                }
            
            game = {
                'gameId': row[0],
                'whitePlayer': row[1],
                'blackPlayer': row[2],
                'fen': row[3] or 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                'pgn': row[4] or '',
                'status': row[5],
                'result': row[6]
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(game)
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            game_id = body_data.get('game_id')
            move = body_data.get('move')
            fen = body_data.get('fen')
            pgn = body_data.get('pgn', '')
            
            if not game_id or not move or not fen:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'game_id, move, and fen required'})
                }
            
            cur.execute('''
                UPDATE games
                SET fen = %s, pgn = %s, updated_at = NOW()
                WHERE id = %s
            ''', (fen, pgn, game_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'gameId': game_id,
                    'move': move,
                    'fen': fen,
                    'timestamp': datetime.now().isoformat()
                })
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            game_id = body_data.get('game_id')
            result = body_data.get('result')
            
            if not game_id or not result:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'game_id and result required'})
                }
            
            cur.execute('''
                UPDATE games
                SET result = %s, status = 'finished', updated_at = NOW()
                WHERE id = %s
            ''', (result, game_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'gameId': game_id,
                    'result': result
                })
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    finally:
        cur.close()
        conn.close()
