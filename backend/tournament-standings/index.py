'''
Business: Get tournament standings table with scores and rankings
Args: event with httpMethod, queryStringParameters (tournament_id)
      context with request_id
Returns: JSON with standings (rank, player info, points, wins, draws, losses)
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
    
    query = f'''
        SELECT 
            u.id,
            u.full_name,
            u.last_name,
            u.birth_date
        FROM t_p91748136_chess_support_world.tournament_registrations tr
        JOIN t_p91748136_chess_support_world.users u ON tr.player_id = u.id
        WHERE tr.tournament_id = {tournament_id} AND tr.status = 'registered'
    '''
    
    cur.execute(query)
    rows = cur.fetchall()
    
    standings = []
    for row in rows:
        user_id = row[0]
        
        wins = 0
        draws = 0
        losses = 0
        points = 0.0
        games_played = 0
        
        standings.append({
            'id': user_id,
            'first_name': row[1] or '',
            'last_name': row[2] or '',
            'birth_date': row[3].isoformat() if row[3] else None,
            'points': points,
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'games_played': games_played
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
            'total': len(standings)
        })
    }