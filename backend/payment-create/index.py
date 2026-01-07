'''
Создание платежа для пополнения баланса через ЮKassa
Args: POST {amount: number, user_id: number}
Returns: payment_url для редиректа
'''

import json
import os
import uuid
from typing import Dict, Any

try:
    import requests
except ImportError:
    requests = None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_str = event.get('body', '{}')
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
        amount = body_data.get('amount')
        user_id = body_data.get('user_id')
        
        if not amount or not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Amount and user_id required'}),
                'isBase64Encoded': False
            }
        
        if amount < 100:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Минимальная сумма - 100 ₽'}),
                'isBase64Encoded': False
            }
        
        shop_id = os.environ.get('YOOKASSA_SHOP_ID')
        secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
        frontend_url = os.environ.get('FRONTEND_URL', 'https://chess-support-world--preview.poehali.dev')
        
        if not shop_id or not secret_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Payment system not configured'}),
                'isBase64Encoded': False
            }
        
        idempotence_key = str(uuid.uuid4())
        
        payment_data = {
            'amount': {
                'value': f'{amount:.2f}',
                'currency': 'RUB'
            },
            'confirmation': {
                'type': 'redirect',
                'return_url': f'{frontend_url}/profile'
            },
            'capture': True,
            'description': f'Пополнение баланса пользователя #{user_id}',
            'metadata': {
                'user_id': str(user_id)
            }
        }
        
        response = requests.post(
            'https://api.yookassa.ru/v3/payments',
            json=payment_data,
            headers={
                'Idempotence-Key': idempotence_key,
                'Content-Type': 'application/json'
            },
            auth=(shop_id, secret_key)
        )
        
        if response.status_code != 200:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Payment creation failed', 'details': response.text}),
                'isBase64Encoded': False
            }
        
        payment_result = response.json()
        payment_url = payment_result.get('confirmation', {}).get('confirmation_url')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'payment_url': payment_url,
                'payment_id': payment_result.get('id')
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }