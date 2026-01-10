import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Добавляет тестовых участников в турнир"""
    
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
    
    try:
        body_str = event.get('body')
        if body_str:
            body = json.loads(body_str)
            tournament_id = body.get('tournament_id', 15)
        else:
            tournament_id = 15
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute("UPDATE tournaments SET status = 'registration_open', rounds = 3, time_control = '5+0', tournament_type = 'swiss' WHERE id = %s", (tournament_id,))
        
        user_ids = [8, 10, 13, 14]
        
        for user_id in user_ids:
            cur.execute("""
                INSERT INTO tournament_participants (tournament_id, user_id, registration_date)
                VALUES (%s, %s, NOW())
                ON CONFLICT DO NOTHING
            """, (tournament_id, user_id))
        
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
                'tournament_id': tournament_id,
                'participants_added': len(user_ids)
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