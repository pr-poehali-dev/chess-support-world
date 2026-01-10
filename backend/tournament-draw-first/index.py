import json
import os
import random
from datetime import datetime
import psycopg2

def handler(event: dict, context) -> dict:
    """API для проведения жеребьевки первого тура турнира"""
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        tournament_id = body.get('tournament_id')
        
        if not tournament_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'tournament_id is required'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute(f"""
            SELECT tr.player_id, u.ms_rating
            FROM t_p91748136_chess_support_world.tournament_registrations tr
            JOIN t_p91748136_chess_support_world.users u ON u.id = tr.player_id
            WHERE tr.tournament_id = {tournament_id} AND tr.status = 'registered'
            ORDER BY u.ms_rating DESC
        """)
        
        participants = cur.fetchall()
        
        if len(participants) < 2:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'Not enough participants'}),
                'isBase64Encoded': False
            }
        
        created_at = datetime.now().isoformat()
        cur.execute(f"""
            INSERT INTO t_p91748136_chess_support_world.tournament_rounds (tournament_id, round_number, status, created_at)
            VALUES ({tournament_id}, 1, 'pending', '{created_at}')
            RETURNING id
        """)
        
        round_id = cur.fetchone()[0]
        
        player_ids = [p[0] for p in participants]
        random.shuffle(player_ids)
        
        if len(player_ids) % 2 != 0:
            player_ids.append(None)
        
        pairings = []
        board_number = 1
        
        for i in range(0, len(player_ids), 2):
            white_id = player_ids[i]
            black_id = player_ids[i + 1] if i + 1 < len(player_ids) else None
            
            black_clause = f"{black_id}" if black_id is not None else "NULL"
            
            cur.execute(f"""
                INSERT INTO t_p91748136_chess_support_world.tournament_pairings 
                (tournament_id, round_id, white_player_id, black_player_id, board_number, created_at)
                VALUES ({tournament_id}, {round_id}, {white_id}, {black_clause}, {board_number}, '{created_at}')
                RETURNING id
            """)
            
            pairing_id = cur.fetchone()[0]
            
            pairings.append({
                'id': pairing_id,
                'board_number': board_number,
                'white_player_id': white_id,
                'black_player_id': black_id
            })
            
            board_number += 1
        
        cur.execute(f"""
            UPDATE t_p91748136_chess_support_world.tournaments
            SET current_round = 1, status = 'in_progress'
            WHERE id = {tournament_id}
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'round_id': round_id,
                'pairings': pairings
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }