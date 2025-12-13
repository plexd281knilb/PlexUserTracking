# STAGE 1: Build the React Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Copy the rest of the frontend code and build it
COPY frontend/ ./
RUN npm run build

# STAGE 2: Set up the Flask Backend
FROM python:3.9-slim

# 1. Install System Dependencies (needed for some Python packages)
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# 2. Set up Backend Workdir
WORKDIR /app/backend

# 3. Install Python Dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy Backend Code
COPY backend/ .

# 5. CRITICAL STEP: Copy the React Build from Stage 1
# This takes the 'build' folder created in Stage 1 and puts it where Flask expects it
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# 6. Run the Application
# We run from /app/backend so the relative paths work
CMD ["python", "app.py"]