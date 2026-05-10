'''
Отправляет предложение ничьей или ответ на него через Pusher.
action: "offer" — предложить ничью, "accept" — принять, "decline" — отклонить
'''

import json
import os
import psycopg2
import pusher

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не авторизован'})
        }

    body = json.loads(event.get('body') or '{}')
    game_id = body.get('game_id')
    action = body.get('action')  # "offer" | "accept" | "decline"

    if not game_id or action not in ('offer', 'accept', 'decline'):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Необходимы game_id и action (offer|accept|decline)'})
        }

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    cur.execute("""
        SELECT white_player_id, black_player_id, status, fen, pgn, current_turn
        FROM t_p91748136_chess_support_world.games
        WHERE id = %s
    """, (game_id,))
    row = cur.fetchone()

    if not row:
        cur.close(); conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Игра не найдена'})
        }

    white_id, black_id, status, fen, pgn, current_turn = row

    if status not in ('active', 'waiting'):
        cur.close(); conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Игра уже завершена'})
        }

    user_id_int = int(user_id)
    if user_id_int not in (white_id, black_id):
        cur.close(); conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Вы не участник этой партии'})
        }

    # Если принято — завершаем партию ничьей
    if action == 'accept':
        cur.execute("""
            UPDATE t_p91748136_chess_support_world.games
            SET status = 'draw', winner = 'draw', updated_at = NOW()
            WHERE id = %s
        """, (game_id,))

        cur.execute("""
            SELECT tournament_id FROM t_p91748136_chess_support_world.games WHERE id = %s
        """, (game_id,))
        t_row = cur.fetchone()
        tournament_id = t_row[0] if t_row else None

        if tournament_id:
            cur.execute("""
                UPDATE t_p91748136_chess_support_world.tournament_pairings
                SET result = '1/2-1/2'
                WHERE game_id = %s
            """, (game_id,))

        conn.commit()

    cur.close(); conn.close()

    pusher_client = pusher.Pusher(
        app_id=os.environ['PUSHER_APP_ID'],
        key=os.environ['PUSHER_KEY'],
        secret=os.environ['PUSHER_SECRET'],
        cluster=os.environ['PUSHER_CLUSTER'],
        ssl=True
    )

    if action == 'offer':
        pusher_client.trigger(f'game-{game_id}', 'draw-offer', {
            'from_player_id': user_id_int
        })
    elif action == 'accept':
        pusher_client.trigger(f'game-{game_id}', 'move', {
            'fen': fen,
            'pgn': pgn or '',
            'current_turn': current_turn,
            'status': 'draw',
            'winner': 'draw'
        })
    elif action == 'decline':
        pusher_client.trigger(f'game-{game_id}', 'draw-decline', {
            'from_player_id': user_id_int
        })

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'action': action})
    }
