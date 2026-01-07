'''
Business: User login with email and password
Args: event with POST body {email, password}
Returns: JWT token and user info or error
'''

import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None

def create_simple_jwt(user_id: int, email: str, secret: str) -> str:
    import base64
    import hmac
    import hashlib
    
    header = base64.urlsafe_b64encode(json.dumps({
        "alg": "HS256",
        "typ": "JWT"
    }).encode()).decode().rstrip('=')
    
    payload = base64.urlsafe_b64encode(json.dumps({
        "user_id": user_id,
        "email": email,
        "exp": int((datetime.now() + timedelta(days=7)).timestamp())
    }).encode()).decode().rstrip('=')
    
    message = f"{header}.{payload}"
    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')
    
    return f"{message}.{signature}"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        email = body_data.get('email', '').strip().lower()
        password = body_data.get('password', '')
        
        if not email or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email и пароль обязательны'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        jwt_secret = os.environ.get('JWT_SECRET', 'default-secret-key')
        
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        print(f"DEBUG: Email={email}, Hash={password_hash}")
        
        cur.execute(
            """
            SELECT id, email, full_name, is_verified, created_at
            FROM t_p91748136_chess_support_world.users
            WHERE email = %s AND password_hash = %s
            """,
            (email, password_hash)
        )
        user = cur.fetchone()
        print(f"DEBUG: User found={user is not None}")
        
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный email или пароль', 'debug_hash': password_hash}),
                'isBase64Encoded': False
            }
        
        if not user['is_verified']:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email не подтвержден. Проверьте почту.'}),
                'isBase64Encoded': False
            }
        
        token = create_simple_jwt(user['id'], user['email'], jwt_secret)
        
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        token_escaped = token.replace("'", "''")
        cur.execute(f"INSERT INTO auth_tokens (user_id, token) VALUES ({user['id']}, '{token_escaped}')")
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'is_verified': user['is_verified'],
                    'created_at': user['created_at'].isoformat() if user.get('created_at') else None
                }
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