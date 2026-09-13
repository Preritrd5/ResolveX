FROM python:3.13-slim

WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY apps/api/requirements.txt /workspace/apps/api/requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r /workspace/apps/api/requirements.txt

# Copy application source code and seed fixtures
COPY apps/ /workspace/apps/
COPY data/ /workspace/data/
COPY docs/ /workspace/docs/
COPY AGENTS.md /workspace/
COPY .env.example /workspace/

ENV PYTHONPATH=/workspace
ENV API_PORT=8000
ENV API_HOST=0.0.0.0

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "apps.api.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
