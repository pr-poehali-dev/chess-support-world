import json
import psycopg2
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Update user data by admin
    Args: event with httpMethod, headers (X-Auth-Token), body with user data
          context with request_id
    Returns: HTTP response with update result
    '''
    method: str = event.get('httpMethod', 'POST')
    
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
    
    admin_id = result[0]
    
    cursor.execute(f"SELECT is_admin FROM users WHERE id = {admin_id}")
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
    
    body_data = json.loads(event.get('body', '{}'))
    user_id = body_data.get('user_id')
    
    if not user_id:
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'user_id обязателен'}),
            'isBase64Encoded': False
        }
    
    update_fields = []
    
    if 'full_name' in body_data:
        full_name_escaped = body_data['full_name'].replace("'", "''")
        update_fields.append(f"full_name = '{full_name_escaped}'")
    
    if 'last_name' in body_data:
        last_name_escaped = body_data['last_name'].replace("'", "''")
        update_fields.append(f"last_name = '{last_name_escaped}'")
    
    if 'middle_name' in body_data:
        middle_name_escaped = body_data['middle_name'].replace("'", "''")
        update_fields.append(f"middle_name = '{middle_name_escaped}'")
    
    if 'birth_date' in body_data:
        birth_date_escaped = body_data['birth_date'].replace("'", "''")
        update_fields.append(f"birth_date = '{birth_date_escaped}'")
    
    if 'fsr_id' in body_data:
        fsr_id_escaped = body_data['fsr_id'].replace("'", "''")
        update_fields.append(f"fsr_id = '{fsr_id_escaped}'")
    
    if 'education_institution' in body_data:
        edu_escaped = body_data['education_institution'].replace("'", "''")
        update_fields.append(f"education_institution = '{edu_escaped}'")
    
    if 'coach' in body_data:
        coach_escaped = body_data['coach'].replace("'", "''")
        update_fields.append(f"coach = '{coach_escaped}'")
    
    if 'city_country' in body_data:
        city_escaped = body_data['city_country'].replace("'", "''")
        update_fields.append(f"city_country = '{city_escaped}'")
    
    if 'representative_phone' in body_data:
        phone_escaped = body_data['representative_phone'].replace("'", "''")
        update_fields.append(f"representative_phone = '{phone_escaped}'")
    
    if 'is_verified' in body_data:
        update_fields.append(f"is_verified = {str(body_data['is_verified']).lower()}")
    
    if 'is_admin' in body_data:
        update_fields.append(f"is_admin = {str(body_data['is_admin']).lower()}")
    
    if 'balance' in body_data:
        balance = body_data['balance']
        update_fields.append(f"balance = {balance}")
    
    if not update_fields:
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Нет данных для обновления'}),
            'isBase64Encoded': False
        }
    
    update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = {user_id}"
    cursor.execute(update_query)
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'message': 'Пользователь обновлен'
        }),
        'isBase64Encoded': False
    }