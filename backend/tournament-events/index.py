'''
SSE endpoint для получения событий турнира (начало тура, новые пары и т.д.)
Клиенты подключаются к этому endpoint и получают уведомления в реальном времени
Args: tournament_id в query параметрах, player_id в query параметрах
Returns: Server-Sent Events stream
'''

import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Получаем параметры
    query_params = event.get('queryStringParameters') or {}
    player_id = query_params.get('player_id')
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    if not player_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'player_id required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        # Проверяем, в каких турнирах зарегистрирован игрок и где только что начался тур
        cur.execute(f"""
            SELECT 
                t.id,
                t.title,
                t.current_round,
                t.status
            FROM t_p91748136_chess_support_world.tournaments t
            INNER JOIN t_p91748136_chess_support_world.tournament_registrations tr
                ON tr.tournament_id = t.id
            WHERE tr.player_id = {player_id}
                AND tr.status = 'registered'
                AND t.status = 'in_progress'
        """)
        
        active_tournaments = cur.fetchall()
        events = []
        
        for tournament_id, title, current_round, status in active_tournaments:
            # Проверяем, есть ли игра для игрока в текущем туре
            cur.execute(f"""
                SELECT 
                    g.id,
                    g.round,
                    g.white_player_id,
                    g.black_player_id,
                    g.status,
                    CASE 
                        WHEN g.white_player_id = {player_id} THEN 'white'
                        WHEN g.black_player_id = {player_id} THEN 'black'
                        ELSE NULL
                    END as player_color
                FROM t_p91748136_chess_support_world.games g
                WHERE g.tournament_id = {tournament_id}
                    AND g.round = {current_round}
                    AND (g.white_player_id = {player_id} OR g.black_player_id = {player_id})
                    AND g.status = 'pending'
            """)
            
            game = cur.fetchone()
            
            if game:
                game_id, round_num, white_id, black_id, game_status, player_color = game
                events.append({
                    'type': 'round_started',
                    'tournament_id': tournament_id,
                    'tournament_title': title,
                    'round': round_num,
                    'game_id': game_id,
                    'player_color': player_color,
                    'opponent_id': black_id if player_color == 'white' else white_id
                })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'events': events,
                'checked_at': datetime.now().isoformat()
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
