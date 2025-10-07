import json
import os
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление турнирами - создание, редактирование, удаление, получение списка
    Args: event - dict с httpMethod (GET/POST/PUT/DELETE), body, queryStringParameters
          context - object с request_id
    Returns: HTTP response с данными турниров
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = None
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            tournament_id = event.get('queryStringParameters', {}).get('id')
            
            if tournament_id:
                cur.execute(
                    "SELECT * FROM t_p91748136_chess_support_world.tournaments WHERE id = %s",
                    (tournament_id,)
                )
                tournament = cur.fetchone()
                
                if not tournament:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Tournament not found'})
                    }
                
                tournament_dict = dict(tournament)
                if tournament_dict.get('start_date'):
                    tournament_dict['start_date'] = tournament_dict['start_date'].isoformat()
                if tournament_dict.get('start_time'):
                    tournament_dict['start_time'] = str(tournament_dict['start_time'])
                entry_fee = tournament_dict.get('entry_fee')
                if entry_fee is not None:
                    tournament_dict['entry_fee'] = float(entry_fee) if isinstance(entry_fee, (Decimal, str)) else entry_fee
                if tournament_dict.get('created_at'):
                    tournament_dict['created_at'] = tournament_dict['created_at'].isoformat()
                if tournament_dict.get('updated_at'):
                    tournament_dict['updated_at'] = tournament_dict['updated_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(tournament_dict)
                }
            else:
                cur.execute(
                    "SELECT * FROM t_p91748136_chess_support_world.tournaments ORDER BY created_at DESC"
                )
                tournaments = cur.fetchall()
                
                tournaments_list = []
                for t in tournaments:
                    t_dict = dict(t)
                    if t_dict.get('start_date'):
                        t_dict['start_date'] = t_dict['start_date'].isoformat()
                    if t_dict.get('start_time'):
                        t_dict['start_time'] = str(t_dict['start_time'])
                    entry_fee = t_dict.get('entry_fee')
                    if entry_fee is not None:
                        t_dict['entry_fee'] = float(entry_fee) if isinstance(entry_fee, (Decimal, str)) else entry_fee
                    if t_dict.get('created_at'):
                        t_dict['created_at'] = t_dict['created_at'].isoformat()
                    if t_dict.get('updated_at'):
                        t_dict['updated_at'] = t_dict['updated_at'].isoformat()
                    tournaments_list.append(t_dict)
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(tournaments_list)
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            title = body_data.get('title')
            if not title:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Title is required'})
                }
            
            description = body_data.get('description', '')
            start_date = body_data.get('start_date')
            start_time = body_data.get('start_time')
            location = body_data.get('location', '')
            max_participants = body_data.get('max_participants')
            time_control = body_data.get('time_control')
            tournament_type = body_data.get('tournament_type')
            entry_fee = body_data.get('entry_fee', 0)
            status = body_data.get('status', 'draft')
            
            cur.execute(
                """
                INSERT INTO t_p91748136_chess_support_world.tournaments 
                (title, description, start_date, start_time, location, max_participants, time_control, tournament_type, entry_fee, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (title, description, start_date, start_time, location, max_participants, time_control, tournament_type, entry_fee, status)
            )
            
            new_tournament = cur.fetchone()
            conn.commit()
            
            tournament_dict = dict(new_tournament)
            if tournament_dict.get('start_date'):
                tournament_dict['start_date'] = tournament_dict['start_date'].isoformat()
            if tournament_dict.get('start_time'):
                tournament_dict['start_time'] = str(tournament_dict['start_time'])
            if isinstance(tournament_dict.get('entry_fee'), Decimal):
                tournament_dict['entry_fee'] = float(tournament_dict['entry_fee'])
            if tournament_dict.get('created_at'):
                tournament_dict['created_at'] = tournament_dict['created_at'].isoformat()
            if tournament_dict.get('updated_at'):
                tournament_dict['updated_at'] = tournament_dict['updated_at'].isoformat()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(tournament_dict)
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            tournament_id = body_data.get('id')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Tournament ID is required'})
                }
            
            update_fields = []
            params = []
            
            if 'title' in body_data:
                update_fields.append('title = %s')
                params.append(body_data['title'])
            if 'description' in body_data:
                update_fields.append('description = %s')
                params.append(body_data['description'])
            if 'start_date' in body_data:
                update_fields.append('start_date = %s')
                params.append(body_data['start_date'])
            if 'start_time' in body_data:
                update_fields.append('start_time = %s')
                params.append(body_data['start_time'])
            if 'location' in body_data:
                update_fields.append('location = %s')
                params.append(body_data['location'])
            if 'max_participants' in body_data:
                update_fields.append('max_participants = %s')
                params.append(body_data['max_participants'])
            if 'time_control' in body_data:
                update_fields.append('time_control = %s')
                params.append(body_data['time_control'])
            if 'tournament_type' in body_data:
                update_fields.append('tournament_type = %s')
                params.append(body_data['tournament_type'])
            if 'entry_fee' in body_data:
                update_fields.append('entry_fee = %s')
                params.append(body_data['entry_fee'])
            if 'status' in body_data:
                update_fields.append('status = %s')
                params.append(body_data['status'])
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.append(tournament_id)
            
            query = f"""
                UPDATE t_p91748136_chess_support_world.tournaments 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(query, params)
            updated_tournament = cur.fetchone()
            
            if not updated_tournament:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Tournament not found'})
                }
            
            conn.commit()
            
            tournament_dict = dict(updated_tournament)
            if tournament_dict.get('start_date'):
                tournament_dict['start_date'] = tournament_dict['start_date'].isoformat()
            if tournament_dict.get('start_time'):
                tournament_dict['start_time'] = str(tournament_dict['start_time'])
            if isinstance(tournament_dict.get('entry_fee'), Decimal):
                tournament_dict['entry_fee'] = float(tournament_dict['entry_fee'])
            if tournament_dict.get('created_at'):
                tournament_dict['created_at'] = tournament_dict['created_at'].isoformat()
            if tournament_dict.get('updated_at'):
                tournament_dict['updated_at'] = tournament_dict['updated_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(tournament_dict)
            }
        
        elif method == 'DELETE':
            tournament_id = event.get('queryStringParameters', {}).get('id')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Tournament ID is required'})
                }
            
            cur.execute(
                "DELETE FROM t_p91748136_chess_support_world.tournaments WHERE id = %s RETURNING id",
                (tournament_id,)
            )
            
            deleted = cur.fetchone()
            
            if not deleted:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Tournament not found'})
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'id': int(tournament_id)})
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Database error: {str(e)}'})
        }
    except Exception as e:
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if conn:
            conn.close()