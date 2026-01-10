import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для сброса турнира в начальное состояние'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_str = event.get('body', '{}')
    if not body_str or body_str.strip() == '':
        body_str = '{}'
    
    try:
        body = json.loads(body_str)
    except:
        body = {}
    
    tournament_id = body.get('tournament_id')
    
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
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute(f"UPDATE tournament_pairings SET game_id = NULL WHERE tournament_id = {tournament_id}")
        
        cur.execute(f"DELETE FROM games WHERE tournament_id = {tournament_id}")
        games_deleted = cur.rowcount
        
        cur.execute(f"DELETE FROM tournament_pairings WHERE tournament_id = {tournament_id}")
        pairings_deleted = cur.rowcount
        
        cur.execute(f"DELETE FROM tournament_rounds WHERE tournament_id = {tournament_id}")
        rounds_deleted = cur.rowcount
        
        cur.execute(f"""
            UPDATE tournaments 
            SET status = 'registration_open', current_round = 0 
            WHERE id = {tournament_id}
        """)
        
        conn.commit()
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
                'deleted': {
                    'games': games_deleted,
                    'pairings': pairings_deleted,
                    'rounds': rounds_deleted
                }
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