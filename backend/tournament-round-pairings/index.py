import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для получения пар конкретного тура"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
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
        query_params = event.get('queryStringParameters', {}) or {}
        tournament_id = query_params.get('tournament_id')
        round_number = query_params.get('round_number')
        
        if not tournament_id or not round_number:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'tournament_id and round_number are required'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute(f"""
            SELECT id FROM tournament_rounds
            WHERE tournament_id = {tournament_id} AND round_number = {round_number}
        """)
        
        round_row = cur.fetchone()
        
        if not round_row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'Round not found'}),
                'isBase64Encoded': False
            }
        
        round_id = round_row[0]
        
        cur.execute(f"""
            SELECT 
                tp.id,
                tp.board_number,
                CONCAT(uw.first_name, ' ', uw.last_name) as white_player_name,
                CASE WHEN tp.black_player_id IS NOT NULL 
                     THEN CONCAT(ub.first_name, ' ', ub.last_name)
                     ELSE NULL 
                END as black_player_name,
                tp.result,
                tp.game_id
            FROM tournament_pairings tp
            JOIN users uw ON uw.id = tp.white_player_id
            LEFT JOIN users ub ON ub.id = tp.black_player_id
            WHERE tp.round_id = {round_id}
            ORDER BY tp.board_number
        """)
        
        pairings = []
        for row in cur.fetchall():
            pairings.append({
                'id': row[0],
                'board_number': row[1],
                'white_player_name': row[2],
                'black_player_name': row[3],
                'result': row[4],
                'game_id': row[5]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'pairings': pairings,
                'total': len(pairings)
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