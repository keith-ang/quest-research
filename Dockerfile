FROM python:3.10

WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies, filtering out Windows-specific packages
RUN grep -v "pywin32" requirements.txt > requirements-linux.txt && \
    pip install --no-cache-dir -r requirements-linux.txt

# Copy the backend directory
COPY ./backend ./backend

# Create necessary directories
RUN mkdir -p /app/backend/storage

# Set environment variables
ENV STORAGE_PATH="/app/backend/storage"

# Expose port 8000
EXPOSE 8000

# Command to run the application
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]