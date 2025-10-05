import json
import requests
import csv
from typing import Dict, Any, Optional
from io import StringIO

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получает текущий рейтинг игрока из CSV файла ФШР по ID или ФИО
    Args: event с httpMethod, queryStringParameters (fsr_id или name)
    Returns: JSON с рейтингом игрока (rapid)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS
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
    fsr_id: str = params.get('fsr_id', '').strip()
    search_name: str = params.get('name', '').strip()
    
    if not fsr_id and not search_name:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'fsr_id or name parameter is required'}, ensure_ascii=False)
        }
    
    # Скачиваем CSV файл с рейтингами
    csv_url = 'https://ratings.ruchess.ru/api/smaster_rapid.csv'
    
    response = requests.get(csv_url, timeout=10)
    
    # Пробуем разные кодировки
    text_content = None
    for encoding in ['windows-1251', 'cp1251', 'utf-8']:
        try:
            text_content = response.content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    
    if not text_content:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to decode CSV file'}, ensure_ascii=False)
        }
    
    # Парсим CSV - пробуем разные разделители
    delimiter = ';'
    if '\t' in text_content[:1000]:
        delimiter = '\t'
    elif ',' in text_content[:1000] and ';' not in text_content[:1000]:
        delimiter = ','
    
    csv_reader = csv.reader(StringIO(text_content), delimiter=delimiter)
    
    # Пропускаем заголовок
    header = next(csv_reader, None)
    
    found_player = None
    
    # Ищем игрока по ID или имени
    debug_row = None
    for row in csv_reader:
        if len(row) < 2:
            continue
        
        # ID может быть в разных позициях
        player_id = row[0].strip() if len(row) > 0 else ''
        player_name = row[1].strip() if len(row) > 1 else ''
        
        # Сохраняем первую найденную строку для отладки
        if not debug_row and (fsr_id and player_id == fsr_id) or (search_name and search_name.lower() in player_name.lower()):
            debug_row = row
        
        # Формат: ID;ФИО;Год;Рейтинг
        birth_year = None
        rating = None
        
        # Обрабатываем все оставшиеся поля
        remaining_fields = [row[i].strip() for i in range(2, len(row)) if row[i].strip()]
        
        # Ищем рейтинг - это самое большое число
        numbers = [int(f) for f in remaining_fields if f.isdigit()]
        
        if numbers:
            # Самое большое число - это рейтинг
            rating = max(numbers)
        
        # Поиск по ID
        if fsr_id and player_id == fsr_id:
            found_player = {
                'fsr_id': player_id,
                'name': player_name,
                'rating_rapid': rating
            }
            break
        
        # Поиск по имени (частичное совпадение)
        if search_name and search_name.lower() in player_name.lower():
            found_player = {
                'fsr_id': player_id,
                'name': player_name,
                'rating_rapid': rating
            }
            break
    
    if not found_player:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Игрок не найден'}, ensure_ascii=False)
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(found_player, ensure_ascii=False)
    }