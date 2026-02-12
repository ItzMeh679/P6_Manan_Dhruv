FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Wait for auth tables, run migrations, then start the app
CMD ["bash", "-c", "python wait-for-auth-tables.py && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]
