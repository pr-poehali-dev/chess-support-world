import json
import os
from datetime import datetime
import psycopg2
import uuid
import pusher

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
        
        cur.execute(f"""
            SELECT id, white_player_id, black_player_id
            FROM t_p91748136_chess_support_world.tournament_pairings
            WHERE round_id = {round_id} AND tournament_id = {tournament_id}
        """)
        
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
        
        cur.execute(f"""
            SELECT round_number
            FROM t_p91748136_chess_support_world.tournament_rounds
            WHERE id = {round_id}
        """)
        
        round_number = cur.fetchone()[0]
        
        created_games = []
        
        for pairing_id, white_id, black_id in pairings:
            if black_id is None:
                cur.execute(f"""
                    UPDATE t_p91748136_chess_support_world.tournament_pairings
                    SET result = '1-0'
                    WHERE id = {pairing_id}
                """)
                continue
            
            game_id = str(uuid.uuid4())
            
            initial_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            now = datetime.now().isoformat()
            
            cur.execute(f"""
                INSERT INTO t_p91748136_chess_support_world.games 
                (id, fen, pgn, white_player_id, black_player_id, current_turn, status, tournament_id, round_number, created_at, updated_at)
                VALUES ('{game_id}', '{initial_fen}', '', {white_id}, {black_id}, 'w', 'active', {tournament_id}, {round_number}, '{now}', '{now}')
            """)
            
            cur.execute(f"""
                UPDATE t_p91748136_chess_support_world.tournament_pairings
                SET game_id = '{game_id}'
                WHERE id = {pairing_id}
            """)
            
            created_games.append({
                'game_id': game_id,
                'white_player_id': white_id,
                'black_player_id': black_id,
                'pairing_id': pairing_id
            })
        
        now = datetime.now().isoformat()
        cur.execute(f"""
            UPDATE t_p91748136_chess_support_world.tournament_rounds
            SET status = 'active', started_at = '{now}'
            WHERE id = {round_id}
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Отправляем событие в Pusher о начале нового тура
        try:
            print(f'[PUSHER] Отправка события new-round для турнира {tournament_id}')
            pusher_client = pusher.Pusher(
                app_id=os.environ['PUSHER_APP_ID'],
                key=os.environ['PUSHER_KEY'],
                secret=os.environ['PUSHER_SECRET'],
                cluster=os.environ['PUSHER_CLUSTER'],
                ssl=True
            )
            
            # Отправляем событие на канал турнира
            pusher_client.trigger(
                f'tournament-{tournament_id}',
                'new-round',
                {
                    'tournament_id': tournament_id,
                    'round_id': round_id,
                    'round_number': round_number,
                    'games': created_games
                }
            )
            print(f'[PUSHER] Событие new-round отправлено')
        except Exception as e:
            print(f'[PUSHER] Ошибка отправки: {e}')
        
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