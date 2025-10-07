"""
Business: Create next round with Swiss pairing for a tournament
Args: event with tournament_id in query params
Returns: Success message with created round number
"""

import json
import os
import psycopg2
from typing import Dict, Any, List, Tuple, Optional


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    tournament_id = params.get('tournament_id')
    
    if not tournament_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'tournament_id required'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        # Get tournament info
        cur.execute(f"""
            SELECT current_round, rounds 
            FROM tournaments 
            WHERE id = {tournament_id}
        """)
        tournament_data = cur.fetchone()
        
        if not tournament_data:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Tournament not found'}),
                'isBase64Encoded': False
            }
        
        current_round, total_rounds = tournament_data
        next_round = (current_round or 0) + 1
        
        if next_round > total_rounds:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Tournament already completed all rounds'}),
                'isBase64Encoded': False
            }
        
        # Get participants with their stats
        cur.execute(f"""
            SELECT 
                tp.user_id,
                COALESCE(SUM(
                    CASE 
                        WHEN g.result = '1-0' AND g.white_player_id = tp.user_id THEN 1
                        WHEN g.result = '0-1' AND g.black_player_id = tp.user_id THEN 1
                        WHEN g.result = '1/2-1/2' THEN 0.5
                        ELSE 0
                    END
                ), 0) as points,
                COALESCE(SUM(
                    CASE 
                        WHEN g.white_player_id = tp.user_id THEN 1
                        ELSE 0
                    END
                ), 0) as white_count
            FROM tournament_participants tp
            LEFT JOIN games g ON (g.white_player_id = tp.user_id OR g.black_player_id = tp.user_id)
                AND g.tournament_id = {tournament_id}
            WHERE tp.tournament_id = {tournament_id}
            GROUP BY tp.user_id
            ORDER BY points DESC, user_id ASC
        """)
        
        participants = cur.fetchall()
        
        if len(participants) < 2:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Not enough participants'}),
                'isBase64Encoded': False
            }
        
        # Get previous pairings
        cur.execute(f"""
            SELECT white_player_id, black_player_id
            FROM games
            WHERE tournament_id = {tournament_id}
        """)
        previous_pairings = set((w, b) for w, b in cur.fetchall())
        
        # Create pairings
        pairings = []
        paired = set()
        
        if next_round == 1:
            # First round: top half vs bottom half
            half = len(participants) // 2
            for i in range(half):
                white_id = participants[i][0]
                black_id = participants[half + i][0] if half + i < len(participants) else None
                if black_id:
                    pairings.append((white_id, black_id))
                    paired.add(white_id)
                    paired.add(black_id)
        else:
            # Swiss pairing: group by points
            points_groups: Dict[float, List[Tuple[int, int]]] = {}
            for user_id, points, white_count in participants:
                if points not in points_groups:
                    points_groups[points] = []
                points_groups[points].append((user_id, white_count))
            
            # Pair within each point group
            for points in sorted(points_groups.keys(), reverse=True):
                group = points_groups[points]
                
                # Sort by color balance (prefer those who played white less)
                group.sort(key=lambda x: x[1])
                
                i = 0
                while i < len(group) - 1:
                    p1_id, p1_white = group[i]
                    p2_id, p2_white = group[i + 1]
                    
                    if p1_id in paired or p2_id in paired:
                        i += 1
                        continue
                    
                    # Check if they already played
                    if (p1_id, p2_id) in previous_pairings or (p2_id, p1_id) in previous_pairings:
                        # Try to find another opponent
                        found = False
                        for j in range(i + 2, len(group)):
                            p3_id, p3_white = group[j]
                            if p3_id not in paired:
                                if (p1_id, p3_id) not in previous_pairings and (p3_id, p1_id) not in previous_pairings:
                                    # Assign colors by balance
                                    if p1_white <= p3_white:
                                        pairings.append((p1_id, p3_id))
                                    else:
                                        pairings.append((p3_id, p1_id))
                                    paired.add(p1_id)
                                    paired.add(p3_id)
                                    group.pop(j)
                                    found = True
                                    break
                        if not found:
                            i += 1
                        continue
                    
                    # Assign colors by balance
                    if p1_white <= p2_white:
                        pairings.append((p1_id, p2_id))
                    else:
                        pairings.append((p2_id, p1_id))
                    
                    paired.add(p1_id)
                    paired.add(p2_id)
                    i += 2
        
        # Insert games
        for white_id, black_id in pairings:
            cur.execute(f"""
                INSERT INTO games (tournament_id, round, white_player_id, black_player_id, status, result)
                VALUES ({tournament_id}, {next_round}, {white_id}, {black_id}, 'pending', NULL)
            """)
        
        # Update tournament current_round
        cur.execute(f"""
            UPDATE tournaments 
            SET current_round = {next_round}
            WHERE id = {tournament_id}
        """)
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'round': next_round,
                'pairings_created': len(pairings)
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
