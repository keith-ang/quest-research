Here's the complete README in Markdown format:

# STORM Report Generator

## Overview

STORM Report Generator is a full-stack web application built to generate comprehensive, research-backed reports on any topic. The application leverages advanced language models and search capabilities to create well-structured reports with proper citations.

The system is built with a modern tech stack, featuring a Next.js 15 frontend with a clean, responsive UI and a Python FastAPI backend that powers the report generation engine. The application supports user authentication, report generation, viewing, and downloading.

## Architecture

The project follows a modular architecture with two main components:

1. **Frontend (Next.js)** - Handles UI/UX, user interactions, and database operations
2. **Backend (FastAPI)** - Provides the report generation service using STORM Wiki Runner

### Technology Stack

#### Frontend

-   **Framework**: Next.js 15
-   **UI Library**: React 19
-   **Authentication**: Clerk
-   **Database**: MongoDB
-   **UI Components**: Tailwind CSS v4 + shadcn/ui
-   **Form Validation**: Zod
-   **Styling**: Tailwind CSS v4

#### Backend

-   **API Framework**: FastAPI
-   **Report Generation**: STORM Wiki Runner
-   **Language Model**: Azure OpenAI (GPT-4o)
-   **Search Engine**: Serper API

## Features

-   **User Authentication**: Secure sign-up and login through Clerk
-   **Report Generation**: Create detailed reports on any topic
-   **Progress Tracking**: Monitor report generation status
-   **Interactive Reading**: Toggle between full report and section-by-section viewing
-   **Report Management**: View, download, and delete reports
-   **Citation Support**: All reports include proper citations with links to sources

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   Python (v3.10+)
-   MongoDB connection
-   Clerk API keys + Set up Clerk Webhook
-   Azure OpenAI API keys
-   Serper API key
-   ngrok (for Clerk webhook development setup)

### Environment Setup

The project uses a central `.env` file in the project root with the following variables:

```
NODE_ENV=development
# Frontend (Next.js) Environment Variables
NEXT_PUBLIC_APP_URL=your_public_app_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
MONGODB_URI=your_mongodb_connection_string

# Backend (FastAPI) Environment Variables
AZURE_API_KEY=your_azure_openai_api_key
AZURE_API_BASE=your_azure_openai_endpoint
AZURE_API_VERSION=your_azure_api_version
SERPER_API_KEY=your_serper_api_key
```

## Clerk Webhook Configuration

For the application to handle user events properly, you need to set up a Clerk webhook:

1. Install ngrok to expose your local server:

    ```bash
    # Install with npm
    npm install -g ngrok

    # or with Homebrew on macOS
    brew install ngrok
    ```

2. Start ngrok to create a public URL to your local server:

    ```bash
    ngrok http 3000
    ```

3. Copy the HTTPS URL provided by ngrok (e.g., `https://your-ngrok-subdomain.ngrok.io`)

4. Go to the Clerk Dashboard:

    - Navigate to the "Webhooks" section
    - Create a new webhook endpoint
    - Enter your ngrok URL + `/api/webhooks/clerk` path (e.g., `https://your-ngrok-subdomain.ngrok.io/api/webhooks/clerk`)
    - Select the user events you want to listen for (typically "user.created" and "user.updated")
    - Save the webhook configuration

5. Copy the "Signing Secret" from the Clerk webhook page

6. Add the webhook secret to your `.env` file:

    ```
    CLERK_WEBHOOK_SECRET=your_webhook_signing_secret
    ```

7. Add your ngrok URL to your `.env` file:
    ```
    NEXT_PUBLIC_APP_URL=https://your-ngrok-subdomain.ngrok.io
    ```

This setup allows Clerk to communicate user events to your local development environment.

### Installation and Setup

#### Frontend (Next.js)

1. Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. The Next.js application will be available at `http://localhost:3000`

#### Backend (FastAPI)

1. From the project root, create and activate a virtual environment:

    ```bash
    python -m venv venv

    # On Windows
    venv\Scripts\activate

    # On macOS/Linux
    source venv/bin/activate
    ```

2. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3. Navigate to the backend directory:

    ```bash
    cd backend
    ```

4. Start the FastAPI server:

    ```bash
    uvicorn main:app --reload
    ```

5. The FastAPI server will be available at `http://localhost:8000`

## Data Flow

1. User requests a report on a specific topic
2. Frontend creates a placeholder report entry in MongoDB
3. Frontend sends topic to Backend API for processing
4. Backend generates the report using STORM Wiki Runner
5. Backend returns the generated content and references
6. Frontend updates the MongoDB record with the complete report
7. User can view, navigate, and download the report
