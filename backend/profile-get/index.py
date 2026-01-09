import json
import psycopg2
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get current user profile data from database
    Args: event with httpMethod, headers (X-Auth-Token)
          context with request_id
    Returns: HTTP response with user data
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
    
    cursor.execute(f"SELECT id, email, full_name, last_name, middle_name, birth_date, fsr_id, education_institution, coach, ms_rating, city_country, representative_phone, is_verified, created_at, is_admin, avatar, balance FROM users WHERE id = {user_id}")
    user_row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not user_row:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Пользователь не найден'}),
            'isBase64Encoded': False
        }
    
    user_data = {
        'id': user_row[0],
        'email': user_row[1],
        'full_name': user_row[2],
        'last_name': user_row[3],
        'middle_name': user_row[4],
        'birth_date': user_row[5].isoformat() if user_row[5] else None,
        'fsr_id': user_row[6],
        'education_institution': user_row[7],
        'coach': user_row[8],
        'ms_rating': user_row[9],
        'city_country': user_row[10],
        'representative_phone': user_row[11],
        'is_verified': user_row[12],
        'created_at': user_row[13].isoformat() if user_row[13] else None,
        'is_admin': user_row[14] or False,
        'avatar': user_row[15],
        'balance': float(user_row[16]) if user_row[16] is not None else 0.0
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'user': user_data
        }),
        'isBase64Encoded': False
    }