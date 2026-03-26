# HCAI-Course-Project
Project for the HCAI course making an email AI assistent tool/interface

## Current prototype

- Top box: context input
- Left middle box: user email input
- Middle button: submit
- Right middle box: AI suggestion output
- Bottom box: reasoning output

## Backend setup

1. Create/activate your venv.
2. Install dependencies:
	- `pip install -r backend/requirements.txt`
3. Create `backend/.env` and set:
	- `OPENAI_API_KEY=your_openai_api_key_here`
	- `OPENAI_MODEL=gpt-4o-mini`

## Run backend

- `uvicorn backend.main:app --host 127.0.0.1 --port 8000`

## Run frontend

- Open `frontend/index.html` in browser.
