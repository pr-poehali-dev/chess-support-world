'''
Business: Get tournament standings table with scores, rankings and round results
Args: event with httpMethod, queryStringParameters (tournament_id)
      context with request_id
Returns: JSON with standings (rank, player info, points, wins, draws, losses, round results) and tournament rounds count
'''

import json
import os
import psycopg2
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
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    tournament_id = params.get('tournament_id')
    
    if not tournament_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'tournament_id is required'})
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    tournament_query = f'''
        SELECT rounds FROM t_p91748136_chess_support_world.tournaments
        WHERE id = {tournament_id}
    '''
    cur.execute(tournament_query)
    tournament_data = cur.fetchone()
    rounds_count = tournament_data[0] if tournament_data and tournament_data[0] else 7
    
    query = f'''
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.birth_date
        FROM t_p91748136_chess_support_world.tournament_participants tp
        JOIN t_p91748136_chess_support_world.users u ON tp.user_id = u.id
        WHERE tp.tournament_id = {tournament_id} AND tp.status = 'registered'
    '''
    
    cur.execute(query)
    rows = cur.fetchall()
    
    standings = []
    for row in rows:
        user_id = row[0]
        
        games_query = f'''
            SELECT 
                round_number,
                result,
                white_player_id,
                black_player_id
            FROM t_p91748136_chess_support_world.games
            WHERE tournament_id = {tournament_id}
            AND (white_player_id = {user_id} OR black_player_id = {user_id})
            AND result IS NOT NULL
            ORDER BY round_number
        '''
        cur.execute(games_query)
        games = cur.fetchall()
        
        wins = 0
        draws = 0
        losses = 0
        points = 0.0
        round_results = {}
        
        for game in games:
            round_num = game[0]
            result = game[1]
            white_id = game[2]
            is_white = white_id == user_id
            
            if result == '1-0':
                if is_white:
                    wins += 1
                    points += 1.0
                    round_results[round_num] = '1'
                else:
                    losses += 1
                    round_results[round_num] = '0'
            elif result == '0-1':
                if is_white:
                    losses += 1
                    round_results[round_num] = '0'
                else:
                    wins += 1
                    points += 1.0
                    round_results[round_num] = '1'
            elif result == '1/2-1/2':
                draws += 1
                points += 0.5
                round_results[round_num] = '½'
        
        games_played = wins + draws + losses
        
        standings.append({
            'id': user_id,
            'first_name': row[1] or '',
            'last_name': row[2] or '',
            'birth_date': row[3].isoformat() if row[3] else None,
            'points': points,
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'games_played': games_played,
            'round_results': round_results
        })
    
    standings.sort(key=lambda x: x['points'], reverse=True)
    
    for i, player in enumerate(standings):
        player['rank'] = i + 1
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'standings': standings,
            'total': len(standings),
            'rounds': rounds_count
        })
    }