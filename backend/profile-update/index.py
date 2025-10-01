import json
import psycopg2
import os
import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Update user profile data (name, email, password)
    Args: event with httpMethod, headers (X-Auth-Token), body (full_name, email, password)
          context with request_id
    Returns: HTTP response with success status and updated user data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
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
    
    body_data = json.loads(event.get('body', '{}'))
    full_name = body_data.get('full_name', '').strip()
    email = body_data.get('email', '').strip().lower()
    password = body_data.get('password', '').strip()
    
    if not full_name or not email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Имя и email обязательны'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT user_id FROM auth_tokens WHERE token = %s",
        (token,)
    )
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
    
    cursor.execute(
        "SELECT email FROM users WHERE email = %s AND id != %s",
        (email, user_id)
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Email уже используется'}),
            'isBase64Encoded': False
        }
    
    if password:
        if len(password) < 6:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Пароль должен быть минимум 6 символов'}),
                'isBase64Encoded': False
            }
        
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            "UPDATE users SET full_name = %s, email = %s, password_hash = %s WHERE id = %s",
            (full_name, email, password_hash, user_id)
        )
    else:
        cursor.execute(
            "UPDATE users SET full_name = %s, email = %s WHERE id = %s",
            (full_name, email, user_id)
        )
    
    conn.commit()
    
    cursor.execute(
        "SELECT id, email, full_name, is_verified, created_at FROM users WHERE id = %s",
        (user_id,)
    )
    user_row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    user_data = {
        'id': user_row[0],
        'email': user_row[1],
        'full_name': user_row[2],
        'is_verified': user_row[3],
        'created_at': user_row[4].isoformat() if user_row[4] else None
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'message': 'Профиль успешно обновлен',
            'user': user_data
        }),
        'isBase64Encoded': False
    }
