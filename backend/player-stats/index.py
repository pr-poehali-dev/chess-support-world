"""
Возвращает статистику игрока: общую, историю партий и историю турниров.
Требует X-Auth-Token в заголовке.
"""

import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = event.get('headers', {})
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не авторизован'})
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute("""
        SELECT u.id FROM t_p91748136_chess_support_world.users u
        JOIN t_p91748136_chess_support_world.auth_tokens t ON t.user_id = u.id
        WHERE t.token = %s AND t.expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Сессия истекла'})
        }

    user_id = row[0]

    # Общая статистика по партиям
    cur.execute("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status IN ('checkmate','resignation','timeout') AND winner = 'white' AND white_player_id = %s) AS wins_white,
            COUNT(*) FILTER (WHERE status IN ('checkmate','resignation','timeout') AND winner = 'black' AND black_player_id = %s) AS wins_black,
            COUNT(*) FILTER (WHERE status IN ('draw','stalemate') OR winner = 'draw') AS draws,
            COUNT(*) FILTER (WHERE status IN ('checkmate','resignation','timeout') AND winner = 'white' AND black_player_id = %s) AS losses_as_black,
            COUNT(*) FILTER (WHERE status IN ('checkmate','resignation','timeout') AND winner = 'black' AND white_player_id = %s) AS losses_as_white
        FROM t_p91748136_chess_support_world.games
        WHERE (white_player_id = %s OR black_player_id = %s)
          AND status NOT IN ('waiting', 'active')
    """, (user_id, user_id, user_id, user_id, user_id, user_id))
    stats_row = cur.fetchone()
    total, wins_w, wins_b, draws, losses_b, losses_w = stats_row
    wins = (wins_w or 0) + (wins_b or 0)
    losses = (losses_b or 0) + (losses_w or 0)
    draws = draws or 0
    total = total or 0

    # История партий (последние 30)
    cur.execute("""
        SELECT
            g.id,
            g.status,
            g.winner,
            g.time_control,
            g.created_at,
            g.tournament_id,
            t.title AS tournament_title,
            g.round_number,
            g.white_player_id,
            g.black_player_id,
            wu.full_name AS white_name,
            wu.last_name AS white_last,
            bu.full_name AS black_name,
            bu.last_name AS black_last
        FROM t_p91748136_chess_support_world.games g
        LEFT JOIN t_p91748136_chess_support_world.tournaments t ON t.id = g.tournament_id
        LEFT JOIN t_p91748136_chess_support_world.users wu ON wu.id = g.white_player_id
        LEFT JOIN t_p91748136_chess_support_world.users bu ON bu.id = g.black_player_id
        WHERE (g.white_player_id = %s OR g.black_player_id = %s)
          AND g.status NOT IN ('waiting', 'active')
        ORDER BY g.created_at DESC
        LIMIT 30
    """, (user_id, user_id))

    games = []
    for r in cur.fetchall():
        gid, status, winner, tc, created, tid, t_title, rnd, wid, bid, wfname, wlname, bfname, blname = r
        my_color = 'white' if wid == user_id else 'black'
        if status in ('draw', 'stalemate') or winner == 'draw':
            my_result = 'draw'
        elif (winner == 'white' and my_color == 'white') or (winner == 'black' and my_color == 'black'):
            my_result = 'win'
        else:
            my_result = 'loss'

        opp_fname = bfname if my_color == 'white' else wfname
        opp_lname = blname if my_color == 'white' else wlname
        opp_name = f"{opp_lname or ''} {opp_fname or ''}".strip() or 'Неизвестный'

        games.append({
            'id': gid,
            'status': status,
            'winner': winner,
            'my_color': my_color,
            'my_result': my_result,
            'time_control': tc,
            'created_at': created.isoformat() if created else None,
            'tournament_id': tid,
            'tournament_title': t_title,
            'round_number': rnd,
            'opponent_name': opp_name,
        })

    # История турниров
    cur.execute("""
        SELECT
            t.id,
            t.title,
            t.status,
            t.tournament_type,
            t.time_control,
            t.start_date,
            t.rounds,
            tr.registered_at,
            (
                SELECT COUNT(*) FILTER (WHERE g.status NOT IN ('waiting','active'))
                FROM t_p91748136_chess_support_world.games g
                WHERE g.tournament_id = t.id
                  AND (g.white_player_id = %s OR g.black_player_id = %s)
            ) AS games_played,
            (
                SELECT COUNT(*)
                FROM t_p91748136_chess_support_world.games g
                WHERE g.tournament_id = t.id
                  AND (g.white_player_id = %s OR g.black_player_id = %s)
                  AND g.status NOT IN ('waiting','active')
                  AND ((g.winner = 'white' AND g.white_player_id = %s) OR (g.winner = 'black' AND g.black_player_id = %s))
            ) AS t_wins,
            (
                SELECT COUNT(*)
                FROM t_p91748136_chess_support_world.games g
                WHERE g.tournament_id = t.id
                  AND (g.white_player_id = %s OR g.black_player_id = %s)
                  AND g.status NOT IN ('waiting','active')
                  AND (g.status IN ('draw','stalemate') OR g.winner = 'draw')
            ) AS t_draws
        FROM t_p91748136_chess_support_world.tournaments t
        JOIN t_p91748136_chess_support_world.tournament_registrations tr ON tr.tournament_id = t.id
        WHERE tr.player_id = %s
        ORDER BY t.start_date DESC NULLS LAST
    """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))

    tournaments = []
    for r in cur.fetchall():
        tid, title, tstatus, ttype, tc, sdate, rounds, reg_at, gp, tw, td = r
        tl = (gp or 0) - (tw or 0) - (td or 0)
        tournaments.append({
            'id': tid,
            'title': title,
            'status': tstatus,
            'tournament_type': ttype,
            'time_control': tc,
            'start_date': sdate.isoformat() if sdate else None,
            'rounds': rounds,
            'games_played': gp or 0,
            'wins': tw or 0,
            'draws': td or 0,
            'losses': max(tl, 0),
            'points': (tw or 0) + (td or 0) * 0.5,
        })

    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'stats': {
                'total': total,
                'wins': wins,
                'draws': draws,
                'losses': losses,
                'win_rate': round(wins / total * 100) if total > 0 else 0,
            },
            'games': games,
            'tournaments': tournaments,
        })
    }
