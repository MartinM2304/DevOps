FROM python:3.11-slim

WORKDIR /app

COPY src/translator-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/translator-service/ /app/

EXPOSE 8001

CMD ["python", "server.py"]