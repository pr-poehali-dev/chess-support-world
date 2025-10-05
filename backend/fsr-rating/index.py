import json
import requests
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
import re

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получает текущий рейтинг игрока с сайта ФШР по ID
    Args: event с httpMethod, queryStringParameters (fsr_id)
    Returns: JSON с рейтингом игрока (rapid, blitz, classic)
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
    
    if not fsr_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'fsr_id parameter is required'})
        }
    
    # Поиск игрока по ID
    search_url = 'https://ratings.ruchess.ru/people'
    
    response = requests.get(
        search_url,
        params={'q': fsr_id},
        headers={'User-Agent': 'Mozilla/5.0'},
        timeout=10
    )
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Ищем таблицу
    name = 'Неизвестно'
    rating_rapid = None
    rating_blitz = None
    rating_classic = None
    fide_id = None
    
    # Ищем таблицу с результатами
    tables = soup.find_all('table')
    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 5:
                # Проверяем, что это строка с данными игрока
                first_cell = cells[0].get_text(strip=True)
                if first_cell.isdigit() or fsr_id in first_cell:
                    # cells[1] - имя, cells[2-4] - рейтинги
                    name = cells[1].get_text(strip=True) if len(cells) > 1 else name
                    
                    if len(cells) > 2:
                        classic_text = cells[2].get_text(strip=True)
                        if classic_text and classic_text.isdigit():
                            rating_classic = int(classic_text)
                    
                    if len(cells) > 3:
                        rapid_text = cells[3].get_text(strip=True)
                        if rapid_text and rapid_text.isdigit():
                            rating_rapid = int(rapid_text)
                    
                    if len(cells) > 4:
                        blitz_text = cells[4].get_text(strip=True)
                        if blitz_text and blitz_text.isdigit():
                            rating_blitz = int(blitz_text)
                    
                    break
    
    # Если не нашли в таблице, значит игрок не найден
    if name == 'Неизвестно':
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Игрок не найден'}, ensure_ascii=False)
        }
    
    result = {
        'fsr_id': fsr_id,
        'name': name,
        'fide_id': fide_id,
        'rating_rapid': rating_rapid,
        'rating_blitz': rating_blitz,
        'rating_classic': rating_classic
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(result, ensure_ascii=False)
    }
