'''
Business: Manage tournament participants - add or remove participants from tournament
Args: event with httpMethod (POST/DELETE), body (tournament_id, player_id), headers (X-Auth-Token)
      context with request_id
Returns: JSON response with success status
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
                'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if not auth_token:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    token_escaped = auth_token.replace("'", "''")
    cur.execute(f"SELECT user_id FROM auth_tokens WHERE token = '{token_escaped}'")
    auth_row = cur.fetchone()
    
    if not auth_row:
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid token'}),
            'isBase64Encoded': False
        }
    
    user_id = auth_row[0]
    
    cur.execute(f"SELECT is_admin FROM users WHERE id = {user_id}")
    admin_check = cur.fetchone()
    
    if not admin_check or not admin_check[0]:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Admin access required'}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        tournament_id = body_data.get('tournament_id')
        player_id = body_data.get('player_id')
        
        if not tournament_id or not player_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'tournament_id and player_id are required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(f'''
            SELECT id FROM tournament_registrations 
            WHERE tournament_id = {tournament_id} AND player_id = {player_id}
        ''')
        existing = cur.fetchone()
        
        if existing:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Participant already registered'}),
                'isBase64Encoded': False
            }
        
        cur.execute(f'''
            INSERT INTO tournament_registrations 
            (tournament_id, player_id, status, registered_at)
            VALUES ({tournament_id}, {player_id}, 'registered', NOW())
        ''')
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'success': True, 'message': 'Participant added'})
        }
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters', {})
        tournament_id = params.get('tournament_id')
        player_id = params.get('player_id')
        
        if not tournament_id or not player_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'tournament_id and player_id are required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(f'''
            DELETE FROM tournament_registrations 
            WHERE tournament_id = {tournament_id} AND player_id = {player_id}
        ''')
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'success': True, 'message': 'Participant removed'})
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
