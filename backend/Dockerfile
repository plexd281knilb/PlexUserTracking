FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    cron \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt


# create data/logs dir
RUN mkdir -p /data /logs

# Cron job is optional; the scheduler in app.py runs scans. Keep container foregrounded by running the Flask app.
EXPOSE 8080

CMD ["python", "-m", "app"]
