# RAG Notebook Frontend (React + TypeScript)

This is the frontend client for the Document Assistant application, built with React, TypeScript, and Vite, styled using modern vanilla CSS.

## Key Features
* **Authentication**: Login and Sign Up screens with JWT storage.
* **Document Management**: Sidebar supporting file uploads (PDF, TXT) and document deletion.
* **Interactive Chat Area**: Chat interface with message streaming support.
* **Source Attribution**: Clickable citation pills showing the specific text chunk referenced by the LLM.

## Technologies Used
* **React 19**: Core UI framework.
* **TypeScript**: Static typing for robustness.
* **Vite**: High-performance frontend build tool and dev server.
* **Vitest**: Unit testing framework.

## Getting Started (Local Development)

### Setup Steps

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The local application will be available at [http://localhost:5173](http://localhost:5173).

## Production Build

To build the optimized static assets:
```bash
npm run build
```
This output is saved to the `dist/` directory and can be served using any static web server (such as Nginx, which is used in the Docker container).

## Testing
To run unit and component tests:
```bash
npm run test
```
To run tests with UI:
```bash
npm run test -- --ui
```
