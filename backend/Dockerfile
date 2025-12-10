FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Expose port 5000
EXPOSE 5000

# Run with Gunicorn for production
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
