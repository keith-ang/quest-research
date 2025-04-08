FROM python:3.12.9

# Set working directory
WORKDIR /app

# Copy requirements file from root directory
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend directory
COPY ./backend ./backend

# Expose port 8000
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]