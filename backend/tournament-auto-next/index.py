import json
import os
from datetime import datetime
import psycopg2
import time

def handler(event: dict, context) -> dict:
    """API для автоматического перехода к следующему туру с задержкой 60 секунд"""
    
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
        
        cur.execute("""
            SELECT id, round_number, status, finished_at
            FROM tournament_rounds
            WHERE tournament_id = %s AND status = 'finished'
            ORDER BY round_number DESC
            LIMIT 1
        """, (tournament_id,))
        
        finished_round = cur.fetchone()
        
        if not finished_round:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'No finished round found'}),
                'isBase64Encoded': False
            }
        
        round_id, round_number, status, finished_at = finished_round
        
        cur.execute("""
            SELECT rounds FROM tournaments WHERE id = %s
        """, (tournament_id,))
        
        total_rounds = cur.fetchone()[0]
        
        if round_number >= total_rounds:
            cur.execute("""
                UPDATE tournaments
                SET status = 'finished'
                WHERE id = %s
            """, (tournament_id,))
            
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
                    'message': 'Tournament finished',
                    'tournament_finished': True
                }),
                'isBase64Encoded': False
            }
        
        time.sleep(60)
        
        next_round_number = round_number + 1
        
        cur.execute("""
            SELECT tp.user_id, u.ms_rating,
                   COALESCE(SUM(
                       CASE 
                           WHEN tpair.result = '1-0' AND tpair.white_player_id = tp.user_id THEN 1.0
                           WHEN tpair.result = '0-1' AND tpair.black_player_id = tp.user_id THEN 1.0
                           WHEN tpair.result = '1/2-1/2' THEN 0.5
                           ELSE 0
                       END
                   ), 0) as score
            FROM tournament_participants tp
            JOIN users u ON u.id = tp.user_id
            LEFT JOIN tournament_pairings tpair ON 
                (tpair.white_player_id = tp.user_id OR tpair.black_player_id = tp.user_id)
                AND tpair.tournament_id = tp.tournament_id
            WHERE tp.tournament_id = %s AND tp.status = 'registered'
            GROUP BY tp.user_id, u.ms_rating
            ORDER BY score DESC, u.ms_rating DESC
        """, (tournament_id,))
        
        players = cur.fetchall()
        
        cur.execute("""
            SELECT white_player_id, black_player_id
            FROM tournament_pairings
            WHERE tournament_id = %s
        """, (tournament_id,))
        
        played_pairs = set()
        for white_id, black_id in cur.fetchall():
            if white_id and black_id:
                played_pairs.add((min(white_id, black_id), max(white_id, black_id)))
        
        cur.execute("""
            SELECT tpair.white_player_id as player_id, COUNT(*) as white_games
            FROM tournament_pairings tpair
            WHERE tpair.tournament_id = %s AND tpair.white_player_id IS NOT NULL
            GROUP BY tpair.white_player_id
        """, (tournament_id,))
        
        white_counts = {row[0]: row[1] for row in cur.fetchall()}
        
        cur.execute("""
            SELECT tpair.black_player_id as player_id, COUNT(*) as black_games
            FROM tournament_pairings tpair
            WHERE tpair.tournament_id = %s AND tpair.black_player_id IS NOT NULL
            GROUP BY tpair.black_player_id
        """, (tournament_id,))
        
        black_counts = {row[0]: row[1] for row in cur.fetchall()}
        
        cur.execute("""
            INSERT INTO tournament_rounds (tournament_id, round_number, status, created_at)
            VALUES (%s, %s, 'pending', %s)
            RETURNING id
        """, (tournament_id, next_round_number, datetime.now()))
        
        new_round_id = cur.fetchone()[0]
        
        pairings = create_swiss_pairings(players, played_pairs, white_counts, black_counts)
        
        board_number = 1
        for white_id, black_id in pairings:
            cur.execute("""
                INSERT INTO tournament_pairings 
                (tournament_id, round_id, white_player_id, black_player_id, board_number, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (tournament_id, new_round_id, white_id, black_id, board_number, datetime.now()))
            board_number += 1
        
        cur.execute("""
            UPDATE tournaments
            SET current_round = %s
            WHERE id = %s
        """, (next_round_number, tournament_id))
        
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
                'message': 'Next round created',
                'round_id': new_round_id,
                'round_number': next_round_number,
                'pairings_count': len(pairings)
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


def create_swiss_pairings(players, played_pairs, white_counts, black_counts):
    """Создание пар по швейцарской системе"""
    players_list = [(p[0], p[1], p[2]) for p in players]
    pairings = []
    used = set()
    
    for i in range(len(players_list)):
        if players_list[i][0] in used:
            continue
            
        player1_id = players_list[i][0]
        
        for j in range(i + 1, len(players_list)):
            if players_list[j][0] in used:
                continue
                
            player2_id = players_list[j][0]
            pair_key = (min(player1_id, player2_id), max(player1_id, player2_id))
            
            if pair_key not in played_pairs:
                white_count_p1 = white_counts.get(player1_id, 0)
                black_count_p1 = black_counts.get(player1_id, 0)
                
                if white_count_p1 <= black_count_p1:
                    white_id, black_id = player1_id, player2_id
                else:
                    white_id, black_id = player2_id, player1_id
                
                pairings.append((white_id, black_id))
                used.add(player1_id)
                used.add(player2_id)
                break
    
    if len(players_list) % 2 != 0:
        for player in players_list:
            if player[0] not in used:
                pairings.append((player[0], None))
                break
    
    return pairings
