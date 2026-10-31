# ML Inference Subsystem

This directory contains standalone Python inference modules for:
1. **Student Burnout Risk Estimation** (`predict_burnout.py`)
2. **Visual Facial Emotion Classification** (`predict_emotion.py` & `extract_emotion_features.py`)

---

## 1. Environment & Dependencies

All inference scripts run strictly within the isolated backend virtual environment (`backend/.venv`):
- `Python`: 3.11.0 (Windows x64)
- `scikit-learn`: 1.6.1 *(exact model serialization match)*
- `joblib`: 1.6.0
- `numpy`: 2.4.6
- `pandas`: 3.1.0
- `mediapipe`: 1.1.1 *(Tasks API FaceLandmarker)*
- `opencv-python`: 5.0.0.93

### Activating the Virtual Environment (PowerShell)

```powershell
# From the backend directory:
.\.venv\Scripts\Activate.ps1

# Or directly with the python executable:
& "D:\dsp project 2\backend\.venv\Scripts\python.exe"
```

---

## 2. Visual Emotion Inference (`predict_emotion.py`)

The visual emotion inference pipeline extracts 104 facial blendshape statistical features from a local video file using MediaPipe FaceLandmarker and predicts affective state probabilities using a trained RBF SVM pipeline (`Pipeline[SimpleImputer -> StandardScaler -> SVC]`).

### Video Sampling Protocol
- **Frame Sampling:** Deterministically samples up to 5 frames evenly spaced across the entire video duration ($[0, \dots, N-1]$).
- **Format Conversion:** OpenCV decodes frames as BGR; each sampled frame is converted to RGB and encapsulated in `mp.Image(image_format=SRGB)`.
- **Detection & Extraction:** MediaPipe FaceLandmarker operates in `IMAGE` mode on each sampled frame, detecting facial landmarks and calculating 52 normalized blendshape coefficients (e.g. `_neutral`, `browDownLeft`, `mouthSmileRight`).
- **Feature Aggregation:** For all frames where a face is successfully detected ($M \ge 1$), the pipeline computes:
  - 52 population means: $\mu_k = \frac{1}{M}\sum_{m=1}^M x_{m,k}$
  - 52 population standard deviations: $\sigma_k = \sqrt{\frac{1}{M}\sum_{m=1}^M (x_{m,k} - \mu_k)^2}$ (`ddof=0`)
- **Ordering:** The 104 features are mapped to the exact sequence specified in `models/emotion_feature_columns.json`.
- **No Face Handling:** If no face is detected across all sampled frames, the system rejects the video with error code `NO_FACE_DETECTED` rather than synthesizing fake features.

### Invocation Examples (PowerShell)

```powershell
# Via CLI Argument
& "D:\dsp project 2\backend\.venv\Scripts\python.exe" `
  "D:\dsp project 2\backend\inference\predict_emotion.py" `
  "D:\dsp project 2\video\vidssave.com Proper Webcam Placement for Virtual Meeting 720P.mp4"

# Via stdin JSON
'{"video_path": "D:\\dsp project 2\\video\\vidssave.com Proper Webcam Placement for Virtual Meeting 720P.mp4"}' | `
  & "D:\dsp project 2\backend\.venv\Scripts\python.exe" `
  "D:\dsp project 2\backend\inference\predict_emotion.py"
```

### Expected Output Format

```json
{
  "success": true,
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
  }
}
```

### Error Protocol

In case of error, a single JSON object is written to `stdout`, and diagnostics are written to `stderr`:
```json
{
  "success": false,
  "error": {
    "code": "NO_FACE_DETECTED",
    "message": "No human face was detected in any of the 5 sampled video frames."
  }
}
```

---

## 3. Burnout Model Inference (`predict_burnout.py`)

Accepts a single JSON object via `stdin` for **Model A** (15 features) or **Model B** (18 features).

### Example Invocation (PowerShell)

```powershell
$inputA = @'
{
  "model": "model_a",
  "features": {
    "age": 20,
    "academic_year": 3,
    "study_hours_per_day": 5.0,
    "exam_pressure": 6.0,
    "academic_performance": 8.0,
    "sleep_hours": 7.0,
    "physical_activity": 3.0,
    "social_support": 6.0,
    "screen_time": 5.0,
    "internet_usage": 4.0,
    "financial_stress": 3.0,
    "family_expectation": 6.0,
    "gender": "Female"
  }
}
'@

$inputA | & "D:\dsp project 2\backend\.venv\Scripts\python.exe" "D:\dsp project 2\backend\inference\predict_burnout.py"
```

---

## 4. Running the Test Suites

### Emotion Inference Test Suite (10 Tests)
```powershell
& "D:\dsp project 2\backend\.venv\Scripts\python.exe" "D:\dsp project 2\backend\inference\test_emotion_inference.py"
```

### Burnout Inference Test Suite (12 Tests)
```powershell
& "D:\dsp project 2\backend\.venv\Scripts\python.exe" "D:\dsp project 2\backend\inference\test_burnout_inference.py"
```

---

## 5. Ethical Guidelines & Limitations

> [!WARNING]
> - **Experimental Signal Only:** Facial emotion classification outputs are exploratory machine learning estimations based on facial expression geometry.
> - **Non-Diagnostic:** They do **not** constitute a psychological assessment, psychiatric diagnosis, or reliable indicator of a student's internal emotional experience or mental health.
> - **No Burnout Conflation:** Visual emotion classes (`Anger`, `Confusion`, `Disgust`, `Happiness`, `Neutral`, `Surprise`) must **never** be combined with or substituted for burnout regression scores.
