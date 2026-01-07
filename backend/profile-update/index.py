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
    full_name = (body_data.get('full_name') or '').strip()
    last_name = (body_data.get('last_name') or '').strip()
    middle_name = (body_data.get('middle_name') or '').strip()
    birth_date = (body_data.get('birth_date') or '').strip()
    fsr_id = (body_data.get('fsr_id') or '').strip()
    education_institution = (body_data.get('education_institution') or '').strip()
    coach = (body_data.get('coach') or '').strip()
    city_country = (body_data.get('city_country') or '').strip()
    representative_phone = (body_data.get('representative_phone') or '').strip()
    email = (body_data.get('email') or '').strip().lower()
    password = (body_data.get('password') or '').strip()
    avatar = (body_data.get('avatar') or '').strip()
    
    if not full_name or not last_name or not birth_date or not email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Имя, фамилия, дата рождения и email обязательны'}),
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
    
    email_escaped = email.replace("'", "''")
    cursor.execute(f"SELECT email FROM users WHERE email = '{email_escaped}' AND id != {user_id}")
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Email уже используется'}),
            'isBase64Encoded': False
        }
    
    full_name_escaped = full_name.replace("'", "''")
    last_name_escaped = last_name.replace("'", "''")
    middle_name_escaped = middle_name.replace("'", "''")
    fsr_id_escaped = fsr_id.replace("'", "''")
    education_institution_escaped = education_institution.replace("'", "''")
    coach_escaped = coach.replace("'", "''")
    city_country_escaped = city_country.replace("'", "''")
    representative_phone_escaped = representative_phone.replace("'", "''")
    
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
        password_hash_escaped = password_hash.replace("'", "''")
        avatar_escaped = avatar.replace("'", "''") if avatar else ''
        if avatar:
            cursor.execute(
                f"UPDATE users SET full_name = '{full_name_escaped}', last_name = '{last_name_escaped}', "
                f"middle_name = '{middle_name_escaped}', birth_date = '{birth_date}', fsr_id = '{fsr_id_escaped}', "
                f"education_institution = '{education_institution_escaped}', coach = '{coach_escaped}', "
                f"city_country = '{city_country_escaped}', representative_phone = '{representative_phone_escaped}', "
                f"email = '{email_escaped}', password_hash = '{password_hash_escaped}', avatar = '{avatar_escaped}' WHERE id = {user_id}"
            )
        else:
            cursor.execute(
                f"UPDATE users SET full_name = '{full_name_escaped}', last_name = '{last_name_escaped}', "
                f"middle_name = '{middle_name_escaped}', birth_date = '{birth_date}', fsr_id = '{fsr_id_escaped}', "
                f"education_institution = '{education_institution_escaped}', coach = '{coach_escaped}', "
                f"city_country = '{city_country_escaped}', representative_phone = '{representative_phone_escaped}', "
                f"email = '{email_escaped}', password_hash = '{password_hash_escaped}' WHERE id = {user_id}"
            )
    else:
        avatar_escaped = avatar.replace("'", "''") if avatar else ''
        if avatar:
            cursor.execute(
                f"UPDATE users SET full_name = '{full_name_escaped}', last_name = '{last_name_escaped}', "
                f"middle_name = '{middle_name_escaped}', birth_date = '{birth_date}', fsr_id = '{fsr_id_escaped}', "
                f"education_institution = '{education_institution_escaped}', coach = '{coach_escaped}', "
                f"city_country = '{city_country_escaped}', representative_phone = '{representative_phone_escaped}', "
                f"email = '{email_escaped}', avatar = '{avatar_escaped}' WHERE id = {user_id}"
            )
        else:
            cursor.execute(
                f"UPDATE users SET full_name = '{full_name_escaped}', last_name = '{last_name_escaped}', "
                f"middle_name = '{middle_name_escaped}', birth_date = '{birth_date}', fsr_id = '{fsr_id_escaped}', "
                f"education_institution = '{education_institution_escaped}', coach = '{coach_escaped}', "
                f"city_country = '{city_country_escaped}', representative_phone = '{representative_phone_escaped}', "
                f"email = '{email_escaped}' WHERE id = {user_id}"
            )
    
    cursor.execute(f"SELECT id, email, full_name, last_name, middle_name, birth_date, fsr_id, education_institution, coach, city_country, representative_phone, is_verified, created_at, avatar FROM users WHERE id = {user_id}")
    user_row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
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
        'city_country': user_row[9],
        'representative_phone': user_row[10],
        'is_verified': user_row[11],
        'created_at': user_row[12].isoformat() if user_row[12] else None,
        'avatar': user_row[13]
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