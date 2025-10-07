'''
Business: API для регистрации игроков на турниры и отмены участия
Args: event с httpMethod (POST/DELETE), body с tournament_id, headers с X-User-Id
Returns: JSON с результатом регистрации или отмены
'''

import json
import os
import psycopg2
from typing import Dict, Any, Optional

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not set')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not authenticated'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            # Получить статус регистрации для турнира
            query_params = event.get('queryStringParameters', {})
            tournament_id = query_params.get('tournament_id')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tournament_id required'})
                }
            
            cur.execute('''
                SELECT id, status, registered_at 
                FROM tournament_registrations 
                WHERE tournament_id = %s AND player_id = %s
            ''', (tournament_id, user_id))
            
            result = cur.fetchone()
            
            if result:
                registration = {
                    'id': result[0],
                    'status': result[1],
                    'registered_at': result[2].isoformat() if result[2] else None,
                    'is_registered': True
                }
            else:
                registration = {'is_registered': False}
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(registration),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            # Регистрация на турнир
            body_str = event.get('body', '{}')
            if not body_str or body_str.strip() == '':
                body_str = '{}'
            body_data = json.loads(body_str)
            tournament_id = body_data.get('tournament_id')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tournament_id required'})
                }
            
            # Проверка существования турнира и возможности регистрации
            cur.execute('''
                SELECT status, max_participants 
                FROM tournaments 
                WHERE id = %s
            ''', (tournament_id,))
            
            tournament = cur.fetchone()
            if not tournament:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tournament not found'}),
                    'isBase64Encoded': False
                }
            
            if tournament[0] != 'registration_open':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Registration is closed'}),
                    'isBase64Encoded': False
                }
            
            # Проверка лимита участников
            if tournament[1]:
                cur.execute('''
                    SELECT COUNT(*) FROM tournament_registrations 
                    WHERE tournament_id = %s AND status = 'registered'
                ''', (tournament_id,))
                current_count = cur.fetchone()[0]
                
                if current_count >= tournament[1]:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Tournament is full'}),
                        'isBase64Encoded': False
                    }
            
            # Регистрация (или обновление статуса если уже был зарегистрирован)
            cur.execute('''
                INSERT INTO tournament_registrations (tournament_id, player_id, status)
                VALUES (%s, %s, 'registered')
                ON CONFLICT (tournament_id, player_id) 
                DO UPDATE SET status = 'registered', registered_at = CURRENT_TIMESTAMP
                RETURNING id, registered_at
            ''', (tournament_id, user_id))
            
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'registration_id': result[0],
                    'registered_at': result[1].isoformat() if result[1] else None
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            # Отмена регистрации
            query_params = event.get('queryStringParameters', {})
            tournament_id = query_params.get('tournament_id')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tournament_id required'}),
                    'isBase64Encoded': False
                }
            
            # Мягкое удаление - меняем статус на cancelled
            cur.execute('''
                UPDATE tournament_registrations 
                SET status = 'cancelled'
                WHERE tournament_id = %s AND player_id = %s
                RETURNING id
            ''', (tournament_id, user_id))
            
            result = cur.fetchone()
            conn.commit()
            
            if result:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Registration cancelled'}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Registration not found'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()