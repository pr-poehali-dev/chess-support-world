import json
import os
from datetime import datetime
import psycopg2
import uuid

def handler(event: dict, context) -> dict:
    """API для автоматического старта тура и создания партий"""
    
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
        round_id = body.get('round_id')
        
        if not tournament_id or not round_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'tournament_id and round_id are required'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, white_player_id, black_player_id
            FROM tournament_pairings
            WHERE round_id = %s AND tournament_id = %s
        """, (round_id, tournament_id))
        
        pairings = cur.fetchall()
        
        if not pairings:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'No pairings found for this round'}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            SELECT round_number
            FROM tournament_rounds
            WHERE id = %s
        """, (round_id,))
        
        round_number = cur.fetchone()[0]
        
        created_games = []
        
        for pairing_id, white_id, black_id in pairings:
            if black_id is None:
                cur.execute("""
                    UPDATE tournament_pairings
                    SET result = '1-0'
                    WHERE id = %s
                """, (pairing_id,))
                continue
            
            game_id = str(uuid.uuid4())
            
            initial_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            
            cur.execute("""
                INSERT INTO games 
                (id, fen, pgn, white_player_id, black_player_id, current_turn, status, tournament_id, round_number, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (game_id, initial_fen, '', white_id, black_id, 'w', 'active', tournament_id, round_number, datetime.now(), datetime.now()))
            
            cur.execute("""
                UPDATE tournament_pairings
                SET game_id = %s
                WHERE id = %s
            """, (game_id, pairing_id))
            
            created_games.append({
                'game_id': game_id,
                'white_player_id': white_id,
                'black_player_id': black_id,
                'pairing_id': pairing_id
            })
        
        cur.execute("""
            UPDATE tournament_rounds
            SET status = 'active', started_at = %s
            WHERE id = %s
        """, (datetime.now(), round_id))
        
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
                'created_games': created_games,
                'total_games': len(created_games)
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
