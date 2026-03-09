# WebApp (LangGo) – Architecture & Development Guide

## Overview

This project is a full‑stack web application for generating Japanese vocabulary flashcards from PDFs or curated JLPT word lists and reviewing them with a spaced‑repetition system.

- **Frontend**: React + TypeScript (Create React App) SPA in `frontend/`
- **Backend**: Node + Express + Firebase Admin + OpenAI in `backend/`
- **Storage & Auth**: Firebase Authentication and Firestore

## Project Structure

- `frontend/` – React SPA (routing, file upload, flashcard display, review UI)
- `backend/` – Express API, OpenAI integration, Firebase Admin
- `Dockerfile`, `docker-compose.yml`, `Procfile` – Deployment options

## Local Development

### Prerequisites

- Node.js 16.x
- npm
- Firebase project and service account
- OpenAI API key

### Environment Variables

Create a `.env` file in the repository root or in the `backend/` and `frontend/` folders as needed.

Backend (in `backend/.env`):

- `PORT` – API port (default `5000`)
- `OPENAI_API_KEY` – OpenAI API key
- `FIREBASE_SERVICE_ACCOUNT` – JSON string of the Firebase service account (preferred)
- `FIREBASE_DATABASE_URL` – Firebase RTDB URL

Frontend (in `frontend/.env`):

- `REACT_APP_API_URL` – Base URL for the backend (e.g. `http://localhost:5000`)

### Running the App

From the repository root:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..

npm run start
```

This starts the Express backend (`backend/server.js`). To run the CRA dev server for the frontend:

```bash
cd frontend
npm start
```

## Code Quality & Conventions

- **Types**: Shared flashcard domain types live in `frontend/src/types/flashcards.ts`.
- **Spaced Repetition**: Scheduling logic is centralized in `frontend/src/utils/spacedRepetition.ts` and on the backend in `backend/src/controllers/reviewController.js`.
- **PDF & Word Utilities**: Text extraction and JLPT word selection are implemented in `frontend/src/utils/pdfUtils.ts` and `frontend/src/utils/wordUtils.ts`.
- **AI Integration**:
  - Client: `frontend/src/utils/FlashGenerator.ts`
  - Server: `backend/src/controllers/openaiController.js`, route `backend/src/routes/openai.js`

## Linting & Formatting

At the repository root:

- ESLint config: `.eslintrc.cjs`
- Prettier config: `.prettierrc.json`

Suggested scripts (root `package.json`):

- `lint`: run ESLint across frontend and backend
- `format`: run Prettier across the codebase

## Testing (Suggested)

- **Frontend**: Use CRA/Jest to test utilities like `wordUtils` and `pdfUtils`.
- **Backend**: Use a lightweight test runner (e.g. Jest + Supertest) to test `/openai` and `/api/review` endpoints.

