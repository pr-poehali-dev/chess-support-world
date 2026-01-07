'''
Обработка webhook от ЮKassa при успешной оплате
Args: POST webhook от ЮKassa
Returns: 200 OK
'''

import json
import os
from typing import Dict, Any

try:
    import psycopg2
except ImportError:
    psycopg2 = None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_str = event.get('body', '{}')
        print(f"DEBUG: Received body: {body_str[:500]}")
        print(f"DEBUG: Event keys: {list(event.keys())}")
        print(f"DEBUG: Full event: {json.dumps(event)[:1000]}")
        print(f"DEBUG: Headers: {event.get('headers', {})}")
        print(f"DEBUG: Query params: {event.get('queryStringParameters', {})}")
        
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
        
        print(f"DEBUG: Parsed body_data keys: {list(body_data.keys())}")
        
        event_type = body_data.get('event')
        print(f"DEBUG: Event type: {event_type}")
        if event_type != 'payment.succeeded':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Event ignored'}),
                'isBase64Encoded': False
            }
        
        payment_obj = body_data.get('object', {})
        payment_status = payment_obj.get('status')
        
        if payment_status != 'succeeded':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Payment not succeeded'}),
                'isBase64Encoded': False
            }
        
        amount_value = float(payment_obj.get('amount', {}).get('value', '0'))
        user_id = int(payment_obj.get('metadata', {}).get('user_id', 0))
        
        if not user_id or amount_value <= 0:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid payment data'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        schema = os.environ.get('MAIN_DB_SCHEMA', 't_p91748136_chess_support_world')
        
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        cursor.execute(f"""
            UPDATE {schema}.users 
            SET balance = balance + {amount_value}
            WHERE id = {user_id}
        """)
        
        cursor.close()
        conn.close()
        
        print(f"Balance updated: user_id={user_id}, amount={amount_value}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }