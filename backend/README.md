# Student Burnout Risk Estimation & Early-Warning Backend

Node.js (Express) REST API service integrating pre-trained scikit-learn burnout regression models and an SVM visual emotion classifier via isolated Python subprocesses.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v22+
- **Python**: 3.11 with the preconfigured virtual environment in `backend/.venv`

### Starting the Server
From the `backend/` directory:
```powershell
# Production / standard mode
npm start

# Development mode (with file watcher)
npm run dev
```
The server binds by default to `http://localhost:5000`.

> **Note:** The backend server must be started separately from the frontend Vite dev server (`http://localhost:3000`).

---

## 2. Configuration (`.env`)

Configure settings in `backend/.env` (based on `backend/.env.example`):
- `PORT`: HTTP server port (default: `5000`).
- `FRONTEND_URL`: Allowed CORS origin for the React application (default: `http://localhost:3000`).
- `ALLOWED_VIDEO_DIRS`: Comma-separated list of directories authorized for emotion video inference (defaults to the project's `video/` directory).

---

## 3. Endpoints & Request Formats

### Health Check
- **`GET /api/health`**
  - **Response (200):**
    ```json
    {
      "status": "ok",
      "service": "student-burnout-backend",
      "modelsReady": true,
      "timestamp": "2026-10-22T18:35:00.000Z"
    }
    ```

### Burnout Prediction (Model A — Academic/Lifestyle)
- **`POST /api/predictions/burnout/model-a`**
  - **Body (JSON):**
    ```json
    {
      "features": {
        "age": 21,
        "academic_year": 3,
        "study_hours_per_day": 6.0,
        "exam_pressure": 5.0,
        "academic_performance": 80.0,
        "sleep_hours": 7.5,
        "physical_activity": 4.0,
        "social_support": 7.0,
        "screen_time": 4.5,
        "internet_usage": 3.5,
        "financial_stress": 3.0,
        "family_expectation": 5.0,
        "gender": "Female"
      }
    }
    ```
  - **Response (200):**
    ```json
    {
      "success": true,
      "assessmentId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "model": "model_a",
      "prediction": 0.6379,
      "createdAt": "2026-10-22T18:35:01.000Z"
    }
    ```

### Burnout Prediction (Model B — Lifestyle + Questionnaire Scores)
- **`POST /api/predictions/burnout/model-b`**
  - **Body (JSON):** Model A fields plus `stress_level`, `anxiety_score`, and `depression_score`.
  - **Response (200):**
    ```json
    {
      "success": true,
      "assessmentId": "3a1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e",
      "model": "model_b",
      "prediction": 1.2145,
      "createdAt": "2026-10-22T18:35:02.000Z"
    }
    ```

### Visual Emotion Classification
- **`POST /api/predictions/emotion`**
  - **Body (JSON):**
    ```json
    {
      "video_path": "D:/dsp project 2/video/vidssave.com Proper Webcam Placement for Virtual Meeting 720P.mp4"
    }
    ```
  - Path traversal protection validates that `video_path` resides strictly within allowlisted directories.
  - **Response (200):**
    ```json
    {
      "success": true,
      "assessmentId": "4c1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6f",
      "model": "emotion_svm",
      "prediction": {
        "label": "Happiness",
        "class_probabilities": {
          "Anger": 0.0276,
          "Confusion": 0.3222,
          "Disgust": 0.0398,
          "Happiness": 0.3487,
          "Neutral": 0.1633,
          "Surprise": 0.0984
        },
        "frames_sampled": 5,
        "faces_detected": 3
      },
      "createdAt": "2026-10-22T18:35:05.000Z"
    }
    ```

### Assessment History
- **`GET /api/assessments`**: Returns all in-memory assessment records (newest first).
- **`GET /api/assessments/:id`**: Returns a single assessment record by ID (or 404).
- **`DELETE /api/assessments/:id`**: Removes a record by ID (or 404).

> **Important — In-Memory Storage:**
> Assessments are stored temporarily in a JavaScript `Map`. All stored records will disappear if the backend process restarts. No database engine is used.

---

## 4. Running Automated Tests

Run the full API integration suite (including Python engine verification):
```powershell
cd "D:\dsp project 2\backend"
npm test
```

---

## 5. Security & Ethical Guardrails

- **Shell Injection Immunity:** Child processes are spawned directly via `child_process.spawn` with `shell: false` and arguments passed as an array. Stdin streaming is used for feature payloads.
- **Path Traversal Defense:** Video file paths are canonically resolved and verified against authorized directory roots before invocation.
- **Resource Limits:** Process timeouts (15s for burnout, 35s for emotion) and buffer caps (1MB) prevent hung processes.
- **Target Leakage Shield:** Request validation strictly rejects fields (`mental_health_index`, `risk_level`, `dropout_risk`).
- **Separation of Concerns:** Emotion predictions are stored separately and are **never** combined with or substituted for burnout regression scores.
- **Non-Diagnostic:** All outputs are experimental statistical estimations and must not be used as clinical or psychiatric diagnoses.
