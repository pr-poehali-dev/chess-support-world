'''
Business: Admin API for creating, updating, and deleting news articles
Args: event - dict with httpMethod (POST, PUT, DELETE), body with news data
      context - object with attributes: request_id, function_name
Returns: HTTP response with success/error message
'''

import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database URL not configured'})
        }
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    cursor.execute('SELECT is_admin FROM users WHERE id = %s', (user_id,))
    user_row = cursor.fetchone()
    
    if not user_row or not user_row[0]:
        cursor.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Admin access required'})
        }
    
    if method == 'GET':
        cursor.execute('''
            SELECT id, title, preview, content, image_url, icon_name, icon_color, published_date, is_published, created_at
            FROM news
            ORDER BY created_at DESC
        ''')
        rows = cursor.fetchall()
        news_list = []
        
        for row in rows:
            news_list.append({
                'id': row[0],
                'title': row[1],
                'preview': row[2],
                'content': row[3],
                'imageUrl': row[4],
                'iconName': row[5],
                'iconColor': row[6],
                'publishedDate': row[7].isoformat() if row[7] else None,
                'isPublished': row[8],
                'createdAt': row[9].isoformat() if row[9] else None
            })
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'news': news_list})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        title = body_data.get('title', '')
        preview = body_data.get('preview', '')
        content = body_data.get('content', '')
        image_url = body_data.get('imageUrl', '')
        icon_name = body_data.get('iconName', 'Newspaper')
        icon_color = body_data.get('iconColor', 'blue')
        published_date = body_data.get('publishedDate', datetime.now().date().isoformat())
        is_published = body_data.get('isPublished', True)
        
        if not title or not content:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Title and content are required'})
            }
        
        cursor.execute('''
            INSERT INTO news (title, preview, content, image_url, icon_name, icon_color, published_date, is_published)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (title, preview, content, image_url, icon_name, icon_color, published_date, is_published))
        
        news_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'id': news_id})
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        news_id = body_data.get('id')
        
        if not news_id:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'News ID is required'})
            }
        
        title = body_data.get('title')
        preview = body_data.get('preview')
        content = body_data.get('content')
        image_url = body_data.get('imageUrl')
        icon_name = body_data.get('iconName')
        icon_color = body_data.get('iconColor')
        published_date = body_data.get('publishedDate')
        is_published = body_data.get('isPublished')
        
        cursor.execute('''
            UPDATE news
            SET title = COALESCE(%s, title),
                preview = COALESCE(%s, preview),
                content = COALESCE(%s, content),
                image_url = COALESCE(%s, image_url),
                icon_name = COALESCE(%s, icon_name),
                icon_color = COALESCE(%s, icon_color),
                published_date = COALESCE(%s, published_date),
                is_published = COALESCE(%s, is_published),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        ''', (title, preview, content, image_url, icon_name, icon_color, published_date, is_published, news_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    if method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        news_id = params.get('id')
        
        if not news_id:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'News ID is required'})
            }
        
        cursor.execute('DELETE FROM news WHERE id = %s', (news_id,))
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }