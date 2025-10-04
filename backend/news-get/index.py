'''
Business: Get published news articles for display on the website
Args: event - dict with httpMethod, queryStringParameters (limit optional)
      context - object with attributes: request_id, function_name
Returns: HTTP response with list of news articles
'''

import json
import os
import psycopg2
from typing import Dict, Any, List

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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    limit = int(params.get('limit', '10'))
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database URL not configured'})
        }
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, content, icon_name, icon_color, published_date, created_at
        FROM news
        WHERE is_published = true
        ORDER BY published_date DESC, created_at DESC
        LIMIT %s
    ''', (limit,))
    
    rows = cursor.fetchall()
    news_list: List[Dict[str, Any]] = []
    
    for row in rows:
        news_list.append({
            'id': row[0],
            'title': row[1],
            'content': row[2],
            'iconName': row[3],
            'iconColor': row[4],
            'publishedDate': row[5].isoformat() if row[5] else None,
            'createdAt': row[6].isoformat() if row[6] else None
        })
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'news': news_list})
    }
