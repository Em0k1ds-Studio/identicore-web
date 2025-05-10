FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git libgl1-mesa-glx libglib2.0-0 python3-opencv && \
    rm -rf /var/lib/apt/lists/*

COPY . .
RUN pip install -r requirements.txt

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]