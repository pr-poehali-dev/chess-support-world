import json
import os
import pusher

def handler(event: dict, context) -> dict:
    '''Тестовая функция для проверки подключения Pusher'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        # Инициализация Pusher
        pusher_client = pusher.Pusher(
            app_id=os.environ['PUSHER_APP_ID'],
            key=os.environ['PUSHER_KEY'],
            secret=os.environ['PUSHER_SECRET'],
            cluster=os.environ['PUSHER_CLUSTER'],
            ssl=True
        )
        
        # Отправка тестового события
        pusher_client.trigger(
            'test-channel',
            'test-event',
            {
                'message': 'Pusher работает!',
                'timestamp': str(context.request_id)
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Событие отправлено в Pusher',
                'channel': 'test-channel',
                'event': 'test-event'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
