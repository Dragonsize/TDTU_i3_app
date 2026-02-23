# TDTU i3 App - Backend

FastAPI backend for TDTU i3 student portal application.

## Tech Stack

- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **Deployment**: Render

## Setup

### Prerequisites

- Python 3.9+
- Supabase account

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables (see `.env.example`)

3. Run database setup:
```bash
# Execute supabase_setup.sql in your Supabase SQL editor
```

### Development

Run the development server:
```bash
uvicorn api.index:app --reload
```

Backend will be available at `http://localhost:8000`

## Environment Variables

Required environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key  
- `JWT_SECRET_KEY` - Secret key for JWT signing
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

## API Documentation

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for complete API reference.

Interactive API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment to Render

1. Create new Web Service on Render
2. Connect your repository
3. Set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn api.index:app --host 0.0.0.0 --port $PORT`
6. Add environment variables in Render dashboard

## Project Structure

```
backend/
├── api/
│   ├── __init__.py
│   ├── index.py          # Main FastAPI application
│   └── requirements.txt  # Python dependencies
├── docs/
│   └── API_DOCUMENTATION.md
├── supabase_setup.sql    # Database schema
├── requirements.txt      # Root dependencies
└── README.md
```
