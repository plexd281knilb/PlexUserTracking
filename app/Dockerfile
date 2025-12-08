FROM python:3.12-slim

RUN pip install pyyaml

WORKDIR /app
COPY app.py /app/app.py

CMD ["python", "/app/app.py"]