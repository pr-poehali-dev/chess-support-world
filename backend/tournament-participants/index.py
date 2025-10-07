'''
Business: Get list of registered participants for a tournament
Args: event with httpMethod, queryStringParameters (tournament_id)
      context with request_id
Returns: JSON with participants list (first_name, last_name, birth_date)
'''

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
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    tournament_id = params.get('tournament_id')
    
    if not tournament_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'tournament_id is required'})
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url, options='-c search_path=t_p91748136_chess_support_world')
    cur = conn.cursor()
    
    query = f'''
        SELECT u.id, u.first_name, u.last_name, u.birth_date
        FROM t_p91748136_chess_support_world.tournament_registrations tr
        JOIN t_p91748136_chess_support_world.users u ON tr.user_id = u.id
        WHERE tr.tournament_id = {tournament_id}
        ORDER BY tr.created_at ASC
    '''
    
    cur.execute(query)
    rows = cur.fetchall()
    
    participants = []
    for row in rows:
        participants.append({
            'id': row[0],
            'first_name': row[1],
            'last_name': row[2],
            'birth_date': row[3].isoformat() if row[3] else None
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'participants': participants,
            'total': len(participants)
        })
    }