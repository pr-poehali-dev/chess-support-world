'''
Business: User registration with email verification
Args: event with POST body {email, password, full_name}
Returns: Success message or error
'''

import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
        full_name = body_data.get('full_name', '').strip()
        last_name = body_data.get('last_name', '').strip()
        middle_name = body_data.get('middle_name', '').strip()
        birth_date = body_data.get('birth_date', '').strip()
        fsr_id = body_data.get('fsr_id', '').strip()
        education_institution = body_data.get('education_institution', '').strip()
        coach = body_data.get('coach', '').strip()
        city_country = body_data.get('city_country', '').strip()
        representative_phone = body_data.get('representative_phone', '').strip()
        
        if not email or not password or not full_name or not last_name or not birth_date:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email, пароль, имя, фамилия и дата рождения обязательны'}),
                'isBase64Encoded': False
            }
        
        if len(password) < 6:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пароль должен быть минимум 6 символов'}),
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
            "SELECT id FROM t_p91748136_chess_support_world.users WHERE email = %s",
            (email,)
        )
        existing_user = cur.fetchone()
        
        if existing_user:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь с таким email уже существует'}),
                'isBase64Encoded': False
            }
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        cur.execute(
            """
            INSERT INTO t_p91748136_chess_support_world.users 
            (email, password_hash, full_name, last_name, middle_name, birth_date, 
             fsr_id, education_institution, coach, city_country, representative_phone, is_verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE)
            RETURNING id
            """,
            (email, password_hash, full_name, last_name, middle_name, birth_date or None,
             fsr_id or None, education_institution or None, coach or None, 
             city_country or None, representative_phone or None)
        )
        user_id = cur.fetchone()['id']
        
        verification_token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=24)
        
        cur.execute(
            """
            INSERT INTO t_p91748136_chess_support_world.verification_tokens (user_id, token, expires_at)
            VALUES (%s, %s, %s)
            """,
            (user_id, verification_token, expires_at)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        
        print(f"SMTP Config: host={smtp_host}, port={smtp_port}, user={smtp_user}, has_password={bool(smtp_password)}")
        
        if smtp_host and smtp_user and smtp_password:
            try:
                verification_link = f"{frontend_url}/?verify={verification_token}"
                print(f"Preparing email to {email} with link: {verification_link}")
                
                msg = MIMEMultipart('alternative')
                msg['Subject'] = 'Подтверждение регистрации - Мир Шахмат'
                msg['From'] = smtp_user
                msg['To'] = email
                
                html_content = f"""
                <html>
                  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h2 style="color: #2563eb;">Добро пожаловать в Мир Шахмат!</h2>
                      <p>Здравствуйте{', ' + full_name if full_name else ''}!</p>
                      <p>Спасибо за регистрацию. Для завершения регистрации, пожалуйста, подтвердите ваш email адрес.</p>
                      <p style="margin: 30px 0;">
                        <a href="{verification_link}" 
                           style="background-color: #fbbf24; color: #000; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;">
                          Подтвердить email
                        </a>
                      </p>
                      <p style="color: #666; font-size: 14px;">
                        Или скопируйте эту ссылку в браузер:<br>
                        <a href="{verification_link}">{verification_link}</a>
                      </p>
                      <p style="color: #666; font-size: 14px;">
                        Ссылка действительна в течение 24 часов.
                      </p>
                    </div>
                  </body>
                </html>
                """
                
                msg.attach(MIMEText(html_content, 'html'))
                
                print(f"Connecting to SMTP server {smtp_host}:{smtp_port}")
                if smtp_port == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                        print("Connected via SSL, logging in...")
                        server.login(smtp_user, smtp_password)
                        print("Logged in, sending message...")
                        server.send_message(msg)
                        print("Email sent successfully!")
                else:
                    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                        print("Connected, starting TLS...")
                        server.starttls()
                        print("TLS started, logging in...")
                        server.login(smtp_user, smtp_password)
                        print("Logged in, sending message...")
                        server.send_message(msg)
                        print("Email sent successfully!")
                
            except Exception as e:
                print(f"Email sending FAILED: {type(e).__name__}: {str(e)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
        else:
            print(f"SMTP not configured properly - missing credentials")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': 'Регистрация прошла успешно! Проверьте email для подтверждения.'
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