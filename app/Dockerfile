FROM python:3.11-slim

# Install cron and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    cron \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source and sample config (will be overridden by mounted config)
COPY src/ /app/src/
COPY config/sample_settings.yaml /config/settings.yaml

RUN pip install --no-cache-dir pyyaml

# Ensure data and logs dirs exist
RUN mkdir -p /data /logs

# Install cron job to run every day at 6pm minutes
RUN echo "0 18 * * * root python /app/src/main.py >> /var/log/plexpayments.log 2>&1" > /etc/cron.d/plexpayments \
 && chmod 0644 /etc/cron.d/plexpayments \
 && crontab /etc/cron.d/plexpayments

# Expose nothing (internal service)
VOLUME ["/config","/data","/logs"]

CMD ["cron", "-f"]
