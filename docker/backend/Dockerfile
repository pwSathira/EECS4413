FROM python:3.10-slim

WORKDIR /opt/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY bw-core/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY bw-core .

EXPOSE 8000

ENV PYTHONPATH=/opt/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]