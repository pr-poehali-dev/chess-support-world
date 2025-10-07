import json
import os
import psycopg2
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class Player:
    id: int
    rating: int
    points: float
    color_preference: int
    opponents: List[int]
    
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generates Swiss system pairings for the next round
    Args: event with tournament_id in query params
    Returns: HTTP response with pairings for the next round
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    tournament_id = params.get('tournament_id')
    
    if not tournament_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'tournament_id required'})
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    tournament_query = f'SELECT current_round, rounds FROM t_p91748136_chess_support_world.tournaments WHERE id = {tournament_id}'
    cur.execute(tournament_query)
    tournament_data = cur.fetchone()
    
    if not tournament_data:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Tournament not found'})
        }
    
    current_round = tournament_data[0] or 0
    total_rounds = tournament_data[1]
    next_round = current_round + 1
    
    if next_round > total_rounds:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Tournament finished, all rounds completed'})
        }
    
    players_query = f'SELECT u.id, u.rating FROM t_p91748136_chess_support_world.tournament_registrations tr JOIN t_p91748136_chess_support_world.users u ON tr.player_id = u.id WHERE tr.tournament_id = {tournament_id} AND tr.status = \'registered\''
    cur.execute(players_query)
    players_data = cur.fetchall()
    
    if len(players_data) < 2:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not enough players'})
        }
    
    games_query = f'SELECT white_player_id, black_player_id, result, round FROM t_p91748136_chess_support_world.games WHERE tournament_id = {tournament_id}'
    cur.execute(games_query)
    games_data = cur.fetchall()
    
    player_stats = {}
    for player_id, rating in players_data:
        player_stats[player_id] = {
            'id': player_id,
            'rating': rating or 1500,
            'points': 0.0,
            'white_count': 0,
            'black_count': 0,
            'opponents': []
        }
    
    for white_id, black_id, result, round_num in games_data:
        if white_id in player_stats:
            player_stats[white_id]['white_count'] += 1
            player_stats[white_id]['opponents'].append(black_id)
            if result == 'white_win':
                player_stats[white_id]['points'] += 1.0
            elif result == 'draw':
                player_stats[white_id]['points'] += 0.5
        
        if black_id in player_stats:
            player_stats[black_id]['black_count'] += 1
            player_stats[black_id]['opponents'].append(white_id)
            if result == 'black_win':
                player_stats[black_id]['points'] += 1.0
            elif result == 'draw':
                player_stats[black_id]['points'] += 0.5
    
    players = []
    for pid, stats in player_stats.items():
        color_pref = stats['white_count'] - stats['black_count']
        players.append(Player(
            id=pid,
            rating=stats['rating'],
            points=stats['points'],
            color_preference=color_pref,
            opponents=stats['opponents']
        ))
    
    pairings = []
    
    if next_round == 1:
        players.sort(key=lambda p: p.rating, reverse=True)
        mid = len(players) // 2
        top_half = players[:mid]
        bottom_half = players[mid:]
        
        for i in range(min(len(top_half), len(bottom_half))):
            pairings.append((top_half[i].id, bottom_half[i].id))
        
        if len(players) % 2 == 1:
            bye_player = players[-1].id
            pairings.append((bye_player, None))
    else:
        players.sort(key=lambda p: (p.points, p.rating), reverse=True)
        
        score_groups = defaultdict(list)
        for player in players:
            score_groups[player.points].append(player)
        
        paired = set()
        
        for score in sorted(score_groups.keys(), reverse=True):
            group = score_groups[score]
            
            while len(group) >= 2:
                p1 = group[0]
                paired_this_round = False
                
                for i in range(1, len(group)):
                    p2 = group[i]
                    
                    if p2.id not in p1.opponents and p1.id not in p2.opponents:
                        if p1.color_preference <= 0 and p2.color_preference >= 0:
                            pairings.append((p1.id, p2.id))
                        elif p1.color_preference >= 0 and p2.color_preference <= 0:
                            pairings.append((p2.id, p1.id))
                        else:
                            if p1.color_preference <= p2.color_preference:
                                pairings.append((p1.id, p2.id))
                            else:
                                pairings.append((p2.id, p1.id))
                        
                        paired.add(p1.id)
                        paired.add(p2.id)
                        group.remove(p1)
                        group.remove(p2)
                        paired_this_round = True
                        break
                
                if not paired_this_round:
                    group.pop(0)
        
        unpaired = [p for p in players if p.id not in paired]
        if len(unpaired) == 1:
            pairings.append((unpaired[0].id, None))
    
    for white_id, black_id in pairings:
        if black_id is None:
            insert_query = f'INSERT INTO t_p91748136_chess_support_world.games (tournament_id, round, white_player_id, black_player_id, result, status) VALUES ({tournament_id}, {next_round}, {white_id}, NULL, \'1-0\', \'completed\')'
        else:
            insert_query = f'INSERT INTO t_p91748136_chess_support_world.games (tournament_id, round, white_player_id, black_player_id, status) VALUES ({tournament_id}, {next_round}, {white_id}, {black_id}, \'pending\')'
        cur.execute(insert_query)
    
    update_query = f'UPDATE t_p91748136_chess_support_world.tournaments SET current_round = {next_round} WHERE id = {tournament_id}'
    cur.execute(update_query)
    
    conn.commit()
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
            'success': True,
            'round': next_round,
            'pairings_count': len(pairings),
            'message': f'Round {next_round} pairings generated'
        })
    }