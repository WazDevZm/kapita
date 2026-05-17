import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

OPENAI_URL = getattr(settings, 'OPENAI_ROUTER_URL', 'https://api.openai.com/v1')
OPENAI_KEY = getattr(settings, 'OPENAI_API_KEY', '')


class OpenAIError(RuntimeError):
    pass


def call_openai_responses(payload: dict, model: str = "gpt-4o-mini", timeout: int = 30) -> dict:
    """Call the OpenAI Router Responses API via server-side proxy.

    Args:
        payload: dict payload to send as the body for the Responses API.
        model: model name to send.
        timeout: request timeout in seconds.

    Returns:
        dict: parsed JSON response.

    Raises:
        OpenAIError on non-2xx responses or configuration issues.
    """
    if not OPENAI_KEY:
        raise OpenAIError('OPENAI_API_KEY is not configured')

    url = f"{OPENAI_URL.rstrip('/')}/responses"
    headers = {
        'Authorization': f'Bearer {OPENAI_KEY}',
        'Content-Type': 'application/json',
    }

    body = {
        'model': model,
        **payload,
    }

    try:
        resp = requests.post(url, json=body, headers=headers, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as exc:
        logger.exception('OpenAI request failed')
        raise OpenAIError(str(exc))

    try:
        return resp.json()
    except ValueError:
        raise OpenAIError('Invalid JSON returned from OpenAI')
