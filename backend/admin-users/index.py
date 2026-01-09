import json
import psycopg2
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get all users list for admin panel
    Args: event with httpMethod, headers (X-Auth-Token)
          context with request_id
    Returns: HTTP response with users list
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
    
    headers = event.get('headers', {})
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cursor = conn.cursor()
    
    token_escaped = token.replace("'", "''")
    cursor.execute(f"SELECT user_id FROM auth_tokens WHERE token = '{token_escaped}'")
    result = cursor.fetchone()
    
    if not result:
        cursor.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Неверный токен'}),
            'isBase64Encoded': False
        }
    
    user_id = result[0]
    
    cursor.execute(f"SELECT is_admin FROM users WHERE id = {user_id}")
    admin_check = cursor.fetchone()
    
    if not admin_check or not admin_check[0]:
        cursor.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Доступ запрещен'}),
            'isBase64Encoded': False
        }
    
    cursor.execute("""
        SELECT id, email, full_name, last_name, middle_name, birth_date, 
               fsr_id, education_institution, coach, ms_rating, city_country, 
               representative_phone, is_verified, is_admin, created_at, balance 
        FROM users 
        ORDER BY created_at DESC
    """)
    
    users = []
    for row in cursor.fetchall():
        users.append({
            'id': row[0],
            'email': row[1],
            'full_name': row[2],
            'last_name': row[3],
            'middle_name': row[4],
            'birth_date': row[5].isoformat() if row[5] else None,
            'fsr_id': row[6],
            'education_institution': row[7],
            'coach': row[8],
            'ms_rating': row[9],
            'city_country': row[10],
            'representative_phone': row[11],
            'is_verified': row[12],
            'is_admin': row[13],
            'created_at': row[14].isoformat() if row[14] else None,
            'balance': float(row[15]) if row[15] is not None else 0.0
        })
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'users': users
        }),
        'isBase64Encoded': False
    }