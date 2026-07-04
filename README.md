# Document Assistant (RAG Notebook)

A full-stack RAG (Retrieval-Augmented Generation) document assistant application built to upload, index, and query documents using PostgreSQL (with `pgvector`), FastAPI, and a React + TypeScript frontend.

## Project Structure

```text
├── backend/               # FastAPI Python Backend
├── frontend/              # React (Vite + TypeScript) Frontend
├── docker-compose.yml     # Multi-container orchestration
├── nginx.conf             # Nginx reverse proxy configuration
└── .env.example           # Example environment variables
```

## Quick Start (Docker Compose)

The easiest way to run the entire stack is using Docker Compose.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with WSL 2 integration enabled if on Windows)

### Steps

1. **Configure Environment Variables**
   Copy the `.env` template from the backend directory to the root (or create a `.env` in the root containing your keys):
   ```bash
   cp backend/.env .env
   ```
   Ensure your `.env` contains a valid `GROQ_API_KEY` and a secure `SECRET_KEY` (for JWT authentication).

2. **Start the Application**
   Run the following command to build the Docker images and start the services:
   ```bash
   docker compose up -d --build
   ```

3. **Access the App**
   * **Frontend Application**: [http://localhost](http://localhost) (runs on port `80` served by Nginx)
   * **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   * **PostgreSQL Database**: Port `5432` (accessible from host using database settings in `.env`)

4. **Shutdown**
   To stop the services while preserving your data:
   ```bash
   docker compose down
   ```
   To stop and wipe database data:
   ```bash
   docker compose down -v
   ```

## Development

For instructions on running backend or frontend individually outside of Docker:
* Refer to the [Backend README](file:///c:/Users/shahs/project/notebook/backend/README.md)
* Refer to the [Frontend README](file:///c:/Users/shahs/project/notebook/frontend/README.md)
