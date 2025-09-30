'''
Business: Verify user email with token
Args: event with GET queryStringParameters {token}
Returns: Success message or error
'''

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None

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
    
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        token = query_params.get('token', '').strip()
        
        if not token:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Токен не указан'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            """
            SELECT vt.user_id, vt.expires_at, u.is_verified
            FROM t_p91748136_chess_support_world.verification_tokens vt
            JOIN t_p91748136_chess_support_world.users u ON u.id = vt.user_id
            WHERE vt.token = %s
            """,
            (token,)
        )
        result = cur.fetchone()
        
        if not result:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный токен'}),
                'isBase64Encoded': False
            }
        
        if result['is_verified']:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Email уже подтвержден'
                }),
                'isBase64Encoded': False
            }
        
        if datetime.now(timezone.utc) > result['expires_at']:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Токен истёк'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            """
            UPDATE t_p91748136_chess_support_world.users
            SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (result['user_id'],)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': 'Email успешно подтвержден!'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }