import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для получения активной партии игрока в турнире"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        query_params = event.get('queryStringParameters', {}) or {}
        tournament_id = query_params.get('tournament_id')
        
        if not tournament_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'tournament_id is required'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT g.id, g.status, g.white_player_id, g.black_player_id, tr.round_number
            FROM games g
            JOIN tournament_rounds tr ON tr.tournament_id = g.tournament_id AND tr.round_number = g.round_number
            WHERE g.tournament_id = %s 
            AND (g.white_player_id = %s OR g.black_player_id = %s)
            AND g.status = 'active'
            AND tr.status = 'active'
            ORDER BY g.created_at DESC
            LIMIT 1
        """, (tournament_id, user_id, user_id))
        
        game = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if game:
            game_id, status, white_id, black_id, round_number = game
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'has_game': True,
                    'game_id': game_id,
                    'round_number': round_number,
                    'white_player_id': white_id,
                    'black_player_id': black_id
                }),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'has_game': False
                }),
                'isBase64Encoded': False
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
