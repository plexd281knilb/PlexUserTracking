# STAGE 1: Build the React Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend

# Copy frontend dependency files (package.json must be copied FIRST)
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm install

# Copy all other frontend source code (now that dependencies are installed)
COPY frontend/ ./

# Build the React application
RUN npm run build

# STAGE 2: Set up the Flask Backend
FROM python:3.11-slim
WORKDIR /app

# Copy backend requirements and install them
COPY backend/requirements.txt .
# Ensure you install the IMAP library dependency if you use a non-standard one
# If you are using standard libraries (imaplib), the below is sufficient.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY backend/ .

# Copy the built React frontend from Stage 1 into a 'static_build' folder in the backend
COPY --from=frontend-build /app/frontend/build ./static_build

# Expose the port Flask runs on
EXPOSE 5052

# Run the application
CMD ["python", "app.py"]