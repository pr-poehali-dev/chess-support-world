"""
Business: Get list of games for a tournament with player names
Args: event with tournament_id in query params
Returns: JSON with games list including player details
"""

import json
import os
import psycopg2
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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    tournament_id = params.get('tournament_id')
    
    if not tournament_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'tournament_id required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        cur.execute(f"""
            SELECT 
                g.id,
                g.round_number,
                g.white_player_id,
                g.black_player_id,
                g.status,
                g.result,
                g.created_at
            FROM t_p91748136_chess_support_world.games g
            WHERE g.tournament_id = {tournament_id}
            ORDER BY g.round_number, g.created_at
        """)
        
        games_data = cur.fetchall()
        
        games = []
        for row in games_data:
            game_id, round_num, white_id, black_id, status, result, created_at = row
            
            games.append({
                'id': game_id,
                'round': round_num,
                'white_player_id': white_id,
                'black_player_id': black_id,
                'status': status,
                'result': result,
                'created_at': created_at.isoformat() if created_at else None
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'games': games}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
