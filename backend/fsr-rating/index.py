import json
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class PlayerRating:
    fsr_id: str
    name: str
    fide_id: Optional[str]
    rating_rapid: Optional[int]
    rating_blitz: Optional[int]
    rating_classic: Optional[int]

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
    
    # Получаем HTML страницу профиля
    page_url = f'https://ratings.ruchess.ru/people/{fsr_id}'
    
    req = urllib.request.Request(
        page_url,
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    
    response = urllib.request.urlopen(req, timeout=10)
    html = response.read().decode('utf-8')
    
    # Парсим данные из HTML
    import re
    
    # Извлекаем имя
    name_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
    name = name_match.group(1).strip() if name_match else 'Неизвестно'
    
    # Извлекаем рейтинги
    def extract_rating(pattern: str) -> Optional[int]:
        match = re.search(pattern, html)
        if match:
            rating_str = match.group(1).strip()
            return int(rating_str) if rating_str.isdigit() else None
        return None
    
    rating_rapid = extract_rating(r'Рапид[^<]*</td>\s*<td[^>]*>(\d+)')
    rating_blitz = extract_rating(r'Блиц[^<]*</td>\s*<td[^>]*>(\d+)')
    rating_classic = extract_rating(r'Классика[^<]*</td>\s*<td[^>]*>(\d+)')
    
    # Извлекаем FIDE ID
    fide_match = re.search(r'ФИДЕ ID[^<]*</td>\s*<td[^>]*>(\d+)', html)
    fide_id = fide_match.group(1) if fide_match else None
    
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