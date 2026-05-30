import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class OpenRouterError(RuntimeError):
    pass


def _api_key():
    for name in ('OPENROUTER_API_KEY', 'OPENAI_API_KEY'):
        key = (getattr(settings, name, '') or '').strip()
        if key and not key.startswith('your-'):
            return key
    return None


def _base_url():
    url = (
        getattr(settings, 'OPENROUTER_BASE_URL', '')
        or getattr(settings, 'OPENAI_ROUTER_URL', '')
        or 'https://openrouter.ai/api/v1'
    )
    return url.rstrip('/')


def _model():
    return getattr(settings, 'OPENROUTER_MODEL', 'google/gemini-2.0-flash-001')


def chat_completion(*, system_prompt, user_message, max_tokens=1024):
    """Send a chat request via OpenRouter (OpenAI-compatible API)."""
    api_key = _api_key()
    if not api_key:
        raise OpenRouterError(
            'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in backend/.env'
        )

    url = f'{_base_url()}/chat/completions'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': getattr(settings, 'OPENROUTER_SITE_URL', 'http://localhost:3000'),
        'X-Title': 'Kapita Mumu',
    }
    body = {
        'model': _model(),
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_message},
        ],
        'max_tokens': max_tokens,
    }

    try:
        response = requests.post(url, json=body, headers=headers, timeout=60)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        logger.exception('OpenRouter request failed')
        detail = ''
        if exc.response is not None:
            try:
                detail = exc.response.json().get('error', {}).get('message', '')
            except ValueError:
                detail = exc.response.text[:200]
        raise OpenRouterError(detail or str(exc)) from exc

    try:
        return data['choices'][0]['message']['content']
    except (KeyError, IndexError, TypeError) as exc:
        raise OpenRouterError('Unexpected response from OpenRouter') from exc
