import json
import os
from datetime import datetime, timedelta
import psycopg2

def handler(event: dict, context) -> dict:
    """API для проверки завершения тура и автоматического старта следующего"""
    
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
            SELECT id, round_number, status
            FROM tournament_rounds
            WHERE tournament_id = %s AND status = 'active'
            ORDER BY round_number DESC
            LIMIT 1
        """, (tournament_id,))
        
        active_round = cur.fetchone()
        
        if not active_round:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'No active round', 'round_finished': False}),
                'isBase64Encoded': False
            }
        
        round_id, round_number, status = active_round
        
        cur.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN g.status IN ('checkmate', 'stalemate', 'draw', 'resignation', 'timeout') THEN 1 ELSE 0 END) as finished
            FROM tournament_pairings tp
            LEFT JOIN games g ON g.id = tp.game_id
            WHERE tp.round_id = %s AND tp.black_player_id IS NOT NULL
        """, (round_id,))
        
        result = cur.fetchone()
        total_games, finished_games = result[0], result[1] or 0
        
        if total_games == 0 or finished_games < total_games:
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
                    'round_finished': False,
                    'total_games': total_games,
                    'finished_games': finished_games
                }),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            UPDATE tournament_pairings tp
            SET result = CASE 
                WHEN g.winner = 'white' THEN '1-0'
                WHEN g.winner = 'black' THEN '0-1'
                WHEN g.winner = 'draw' THEN '1/2-1/2'
                ELSE tp.result
            END
            FROM games g
            WHERE tp.game_id = g.id 
            AND tp.round_id = %s 
            AND tp.result IS NULL
        """, (round_id,))
        
        cur.execute("""
            UPDATE tournament_rounds
            SET status = 'finished', finished_at = %s
            WHERE id = %s
        """, (datetime.now(), round_id))
        
        cur.execute("""
            SELECT rounds FROM tournaments WHERE id = %s
        """, (tournament_id,))
        
        total_rounds = cur.fetchone()[0]
        
        conn.commit()
        
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
                    'round_finished': True,
                    'tournament_finished': True,
                    'round_number': round_number
                }),
                'isBase64Encoded': False
            }
        
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
                'round_finished': True,
                'tournament_finished': False,
                'next_round_number': round_number + 1,
                'round_number': round_number
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
