FROM python:3.13-slim

WORKDIR /workspace

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/requirements.txt /workspace/apps/api/requirements.txt

RUN pip install --no-cache-dir -r /workspace/apps/api/requirements.txt

COPY apps/ /workspace/apps/

ENV PYTHONPATH=/workspace
ENV API_PORT=8000
ENV API_HOST=0.0.0.0

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "apps.api.app.main:app", "--host", "0.0.0.0", "--port", "8000"]