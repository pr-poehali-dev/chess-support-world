import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение статистики базы данных для админ-панели
    Args: event с httpMethod и headers (требуется X-Auth-Token)
    Returns: HTTP response с количеством записей в каждой таблице
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if not auth_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Требуется токен авторизации'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'DATABASE_URL не настроен'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    schema = 't_p91748136_chess_support_world'
    
    cur.execute(f"SELECT user_id FROM {schema}.auth_tokens WHERE token = %s AND expires_at > NOW()", (auth_token,))
    token_row = cur.fetchone()
    
    if not token_row:
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Недействительный токен'})
        }
    
    user_id = token_row[0]
    
    cur.execute(f"SELECT is_admin FROM {schema}.users WHERE id = %s", (user_id,))
    user_row = cur.fetchone()
    
    if not user_row or not user_row[0]:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Доступ запрещён'})
        }
    
    stats = {}
    
    tables = ['users', 'auth_tokens', 'email_verifications', 'verification_tokens']
    for table in tables:
        cur.execute(f"SELECT COUNT(*) FROM {schema}.{table}")
        count_row = cur.fetchone()
        stats[table] = count_row[0] if count_row else 0
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'success': True, 'stats': stats})
    }