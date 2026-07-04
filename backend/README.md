# RAG Backend API (FastAPI)

This is the FastAPI backend serving the Document Assistant application. It handles user authentication, document parsing (PDF/TXT), vector embeddings creation using `fastembed`, and RAG-based chat using the `Groq` SDK.

## Key Technologies
* **FastAPI**: Modern, fast web framework for building APIs.
* **SQLAlchemy & Alembic**: Database ORM and migrations helper.
* **PostgreSQL + pgvector**: Relational database with vector similarity search capabilities.
* **FastEmbed**: Lightweight, fast library for generating text embeddings (default: `BAAI/bge-small-en-v1.5`).
* **PyMuPDF (fitz)**: Optimized library for parsing PDFs and extracting text.
* **Groq SDK**: Connects to the Groq Cloud API for fast llama3 text completions.
* **FastAPI Users**: Authentication system using JWT tokens.

## Getting Started (Local Development)

### Prerequisites
* Python 3.12+
* Running PostgreSQL database with `pgvector` extension enabled

### Setup Steps

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment & install dependencies**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   Create a `.env` file based on `.env.example` in the root or copy/rename it:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to configure your `DATABASE_URL`, `GROQ_API_KEY`, and `SECRET_KEY`.

4. **Run Database Migrations / Initialize DB**
   The application automatically initializes database tables on startup.

5. **Start Development Server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to view the interactive Swagger API documentation.

## Testing
Run unit and integration tests using `pytest`:
```bash
pytest
```
Tests are located in the `tests/` directory.
