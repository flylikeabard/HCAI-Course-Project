import json
import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / '.env', override=True)


class GenerateRequest(BaseModel):
    prompt: str
    context: str = ''


class GenerateResponse(BaseModel):
    output: str
    reasoning: str


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health_check():
    return {'status': 'ok'}


@app.post('/api/generate', response_model=GenerateResponse)
def generate_text(payload: GenerateRequest):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail='Missing OPENAI_API_KEY environment variable.')

    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail='Prompt cannot be empty.')

    context = payload.context.strip()

    user_input = prompt
    if context:
        user_input = f'Context:\n{context}\n\nUser email:\n{prompt}'

    client = OpenAI(api_key=api_key)
    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

    try:
        response = client.responses.create(
            model=model,
            input=[
                {
                    'role': 'system',
                    'content': (
                        'You improve draft emails and keep the user\'s intent. '
                        'Respond ONLY with a JSON object using exactly these two keys:\n'
                        '  "email_suggestion": the polished email text\n'
                        '  "reasoning": a short explanation of the changes you made\n'
                        'Do not include any text outside the JSON object.'
                    ),
                },
                {
                    'role': 'user',
                    'content': user_input,
                },
            ],
            text={'format': {'type': 'json_object'}},
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f'OpenAI request failed: {error}') from error

    try:
        parsed = json.loads(response.output_text)
        email_output = parsed.get('email_suggestion', '').strip()
        reasoning_output = parsed.get('reasoning', '').strip()
    except (json.JSONDecodeError, AttributeError) as error:
        raise HTTPException(status_code=500, detail=f'Failed to parse AI response as JSON: {error}') from error

    return {
        'output': email_output,
        'reasoning': reasoning_output,
    }


if __name__ == '__main__':
    uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=True)

