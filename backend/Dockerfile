FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Expose port 8000 (Koyeb default)
EXPOSE 8000

# Run with Gunicorn for production
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
