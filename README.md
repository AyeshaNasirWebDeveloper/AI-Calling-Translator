
# AI Voice Call Translation App (Urdu-English)

This is a full-stack, production-ready AI Voice Call Translation Application that provides real-time, duplex translation between Urdu and English speakers.

## Core Functionality

- **Real-time Duplex Communication**: User A speaks in Urdu, and User B hears it in English. User B speaks in English, and User A hears it in Urdu.
- **AI-Powered**: Leverages the Gemini API for high-quality Speech-to-Text, Translation, and Text-to-Speech.
- **Web-Based**: Built with modern web technologies for accessibility and ease of use.

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, WebRTC
- **Backend**: Node.js, Express, WebSocket (ws), Gemini API
- **Deployment**: Ready for Vercel (Frontend) and Render (Backend).

## Features

- **One-Click Calling**: Simple "Start Call" button to initiate communication.
- **Live Waveform Animation**: Visual feedback when a user is speaking.
- **Translation Subtitles**: Displays the translated text for both users in real-time.
- **Language Toggle**: Easily switch the source and target languages.
- **Robust Error Handling**: Manages microphone permissions, network issues, and API errors gracefully.
- **Loading States**: Clear visual indicators during translation and processing.

---

## Project Setup

### Prerequisites

- Node.js (v18 or later)
- `npm` or `yarn`
- A valid Gemini API Key

### 1. Clone the Repository

```bash
git clone <https://github.com/AyeshaNasirWebDeveloper/AI-Calling-Translator.git>
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

**Install dependencies:**

```bash
npm install
```

**Create an environment file:**

Create a `.env` file in the `backend` directory and add your Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

**Run the backend server:**

```bash
npm start
```

The backend server will start on `http://localhost:3001`.

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
```

**Install dependencies:**

```bash
npm install
```

**Run the frontend development server:**

```bash
npm run dev
```

The frontend application will be accessible at `http://localhost:5173` (or another port if 5173 is busy).

---

## How It Works

1.  **Signaling**: When a user starts the app, it connects to the backend WebSocket server. The backend manages the WebRTC signaling process to establish a peer-to-peer connection between the two users.
2.  **Voice Streaming**: Once connected, users' microphone audio is streamed directly to each other using WebRTC. The audio is also captured and sent to the backend via WebSocket for processing.
3.  **AI Processing Pipeline**:
    - The backend receives the audio chunk.
    - **Speech-to-Text**: The audio is converted to text using the Gemini API.
    - **Translation**: The resulting text is translated to the target language (Urdu or English).
    - **Text-to-Speech**: The translated text is converted back into audio.
4.  **Receiving Translation**: The processed audio and subtitle text are sent back to the client, who then plays the audio and displays the subtitle.

## Deployment

### Backend (Render)

1.  Push your code to a GitHub repository.
2.  Create a new "Web Service" on Render and connect your repository.
3.  Set the "Start Command" to `npm start`.
4.  Add your `GEMINI_API_KEY` as an environment variable in the Render dashboard.
5.  Deploy!

### Frontend (Vercel)

1.  Push your code to a GitHub repository.
2.  Create a new project on Vercel and connect your repository.
3.  Vercel will automatically detect that it's a React/Vite project.
4.  Before deploying, set the `VITE_BACKEND_URL` environment variable in the Vercel project settings to your deployed Render backend URL.
5.  Deploy!

---

This project is designed to be a complete, deployable solution. The code is modular and commented to be beginner-friendly.
