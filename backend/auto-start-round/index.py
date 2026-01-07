'''
Автоматический запуск первого тура турнира по времени начала
Args: Вызывается периодически (каждую минуту) или по запросу
Returns: JSON с информацией о запущенных турах
'''

import json
import os
import psycopg2
from datetime import datetime, time
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
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
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        now = datetime.now()
        current_date = now.date()
        current_time = now.time()
        
        # Найти турниры со статусом registration_open, где время начала уже прошло
        cur.execute(f"""
            SELECT id, title, start_date, start_time
            FROM t_p91748136_chess_support_world.tournaments
            WHERE status = 'registration_open'
            AND start_date <= '{current_date}'
        """)
        
        tournaments = cur.fetchall()
        started_tournaments = []
        
        for tournament in tournaments:
            tournament_id, title, start_date, start_time = tournament
            
            # Проверяем время
            should_start = False
            
            if start_date < current_date:
                # Дата уже прошла - точно стартуем
                should_start = True
            elif start_date == current_date and start_time:
                # Сегодня - проверяем время
                if current_time >= start_time:
                    should_start = True
            elif start_date == current_date and not start_time:
                # Сегодня, но время не указано - стартуем
                should_start = True
            
            if should_start:
                # Проверяем, есть ли зарегистрированные участники
                cur.execute(f"""
                    SELECT COUNT(*) FROM t_p91748136_chess_support_world.tournament_registrations
                    WHERE tournament_id = {tournament_id} AND status = 'registered'
                """)
                
                participants_count = cur.fetchone()[0]
                
                if participants_count >= 2:
                    # Меняем статус турнира на in_progress
                    cur.execute(f"""
                        UPDATE t_p91748136_chess_support_world.tournaments
                        SET status = 'in_progress', current_round = 0
                        WHERE id = {tournament_id}
                    """)
                    
                    # Создаем первый тур через швейцарскую систему
                    cur.execute(f"""
                        SELECT 
                            tr.player_id
                        FROM t_p91748136_chess_support_world.tournament_registrations tr
                        WHERE tr.tournament_id = {tournament_id} AND tr.status = 'registered'
                        ORDER BY tr.player_id ASC
                    """)
                    
                    participants = [row[0] for row in cur.fetchall()]
                    
                    # Первый раунд: верхняя половина против нижней
                    half = len(participants) // 2
                    pairings = []
                    
                    for i in range(half):
                        white_id = participants[i]
                        black_id = participants[half + i] if half + i < len(participants) else None
                        if black_id:
                            pairings.append((white_id, black_id))
                    
                    # Создаем игры
                    for white_id, black_id in pairings:
                        cur.execute(f"""
                            INSERT INTO t_p91748136_chess_support_world.games 
                            (tournament_id, round, white_player_id, black_player_id, status, result)
                            VALUES ({tournament_id}, 1, {white_id}, {black_id}, 'pending', NULL)
                        """)
                    
                    # Обновляем текущий раунд
                    cur.execute(f"""
                        UPDATE t_p91748136_chess_support_world.tournaments
                        SET current_round = 1
                        WHERE id = {tournament_id}
                    """)
                    
                    conn.commit()
                    
                    started_tournaments.append({
                        'id': tournament_id,
                        'title': title,
                        'participants': participants_count,
                        'pairings': len(pairings)
                    })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'checked_at': now.isoformat(),
                'started_tournaments': started_tournaments,
                'count': len(started_tournaments)
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
