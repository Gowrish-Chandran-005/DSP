# Calma: Student Burnout Risk Estimation & Early-Warning System (DSP Project)

An AI-driven early-warning and well-being monitoring system designed for university students. Calma combines machine learning regression models for academic burnout risk estimation with MediaPipe-based visual emotion and fatigue detection to provide timely, actionable insights.

---

## 🌟 Key Features

1. **Academic Burnout Prediction (Dual Models)**:
   - **Model A (Linear Regressor)**: Rapid baseline evaluation.
   - **Model B (HistGradientBoosting Regressor)**: High-precision risk scoring across 18 academic, psychological, and lifestyle dimensions.
2. **Visual Emotion & Fatigue Inference**:
   - MediaPipe Face Landmarker (52 facial blendshape coefficients).
   - Trained Support Vector Classifier (SVC) pipeline analyzing facial signals (fatigue, stress, neutral focus) from study session video.
3. **Study Focus & Facial Signal Monitor**:
   - Client-side camera session tracking with custom study sprint durations (25m, 45m, 60m, 90m).
   - In-memory privacy-first processing with break reminders and posture check-ins.
4. **Student Profile & Academic Context**:
   - Comprehensive academic profile with VIT Vellore course tracking, weekly study hours, workload ratings, and honest integration interfaces (VTOP & Screen-Time).
5. **Standardized Assessments Library**:
   - 5 structured, non-diagnostic student questionnaires covering academic strain, study habits, sleep quality, and daily check-ins.

---

## 🏗️ Project Architecture

```
dsp-project-2/
├── backend/
│   ├── assessments/             # Standardized assessment questionnaires & catalog
│   ├── inference/               # Python ML inference scripts (burnout & emotion)
│   ├── models/                  # Serialized ML models (.joblib, .task, schemas)
│   ├── src/                     # Express REST API (routes, controllers, runner)
│   └── tests/                   # Automated API & inference integration test suite
├── frontend/
│   └── visual-sketchpad/        # React + Vite + TailwindCSS web application
├── video/                       # Sample video clips for emotion inference testing
├── output/                      # Deployment bundles
├── 41598_2024_84829_MOESM1_ESM.xlsx # Academic reference dataset
└── dsp_project_2.py             # Model training & exploratory data analysis script
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **Python**: 3.10+ (compatible with scikit-learn 1.6.1)
- **Git**

---

### 1. Backend Setup

```bash
cd backend

# 1. Install Node.js dependencies
npm install

# 2. Set up Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

# 3. Install required Python packages
pip install scikit-learn==1.6.1 joblib numpy pandas mediapipe opencv-python

# 4. Copy environment configuration
cp .env.example .env

# 5. Run automated tests (15 verification tests)
npm test

# 6. Start the API server
npm start
# Server starts at http://localhost:5000
```

---

### 2. Frontend Setup

```bash
cd frontend/visual-sketchpad

# 1. Install dependencies
npm install

# 2. Copy environment configuration
cp .env.example .env

# 3. Start development server
npm run dev
# Web application available at http://localhost:3000 (or http://localhost:5173)
```

---

## 📊 Datasets & Training

- The 1M Student Burnout dataset used in `dsp_project_2.py` can be downloaded directly from HuggingFace:
  [student_mental_health_burnout_1M.csv](https://huggingface.co/datasets/eliel2003/student-burnout-analysis-2026/resolve/main/student_mental_health_burnout_1M.csv)

---

## 🛡️ Privacy & Ethical Safeguards

- Non-diagnostic tool intended for educational self-awareness and student wellness support.
- Camera frames during study monitoring are analyzed in-memory; no raw video streams are stored or transmitted.
- Third-party portal connections (VTOP, OS screen time) respect browser sandbox boundaries and avoid credential interception.
