FROM python:3.10

WORKDIR /app

# Copy requirements file but prepare to handle errors
COPY requirements.txt .

# Install dependencies, filtering out Windows-specific packages
RUN pip install --no-cache-dir --upgrade pip && \
    grep -v "pywin32" requirements.txt > requirements-linux.txt && \
    pip install --no-cache-dir -r requirements-linux.txt

# Copy the backend directory
COPY ./backend ./backend

# Expose port 8000
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]