#!/usr/bin/env python3
"""
Emotion Prediction Pipeline
Extracts 104 facial blendshape statistical features from a video file
and predicts emotion class and probabilities using the trained RBF SVM pipeline.
"""

import sys
import os
import json
import math
from pathlib import Path

# Add script directory to sys.path for local module resolution
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from extract_emotion_features import extract_features_from_video, VideoExtractionError


def respond_error(code: str, message: str, exit_code: int = 0):
    """Write standardized failure JSON to stdout and exit."""
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
    }
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()
    sys.exit(exit_code)


def respond_success(label: str, probabilities: dict, frames_sampled: int, faces_detected: int):
    """Write standardized success JSON to stdout and exit."""
    payload = {
        "success": True,
        "model": "emotion_svm",
        "prediction": {
            "label": label,
            "class_probabilities": probabilities,
            "frames_sampled": frames_sampled,
            "faces_detected": faces_detected,
        },
    }
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()
    sys.exit(0)


def resolve_video_path() -> str:
    """
    Resolves video path from either CLI argument (argv[1])
    or stdin JSON payload ({"video_path": "..."}).
    """
    if len(sys.argv) > 1 and sys.argv[1].strip():
        return sys.argv[1].strip()

    # Fall back to stdin if not attached to interactive terminal
    if not sys.stdin.isatty():
        try:
            stdin_text = sys.stdin.read().strip()
            if stdin_text:
                data = json.loads(stdin_text)
                if isinstance(data, dict) and "video_path" in data:
                    return str(data["video_path"]).strip()
        except Exception as e:
            sys.stderr.write(f"Stdin JSON parsing error: {e}\n")
            respond_error("INVALID_INPUT", "Failed to parse JSON payload from stdin.")

    respond_error(
        "INVALID_INPUT",
        "Video path not provided. Pass video path as CLI argument or stdin JSON ({\"video_path\": \"...\"}).",
    )


def run_pipeline():
    """Main pipeline execution entry point."""
    if hasattr(sys.stdin, "reconfigure"):
        sys.stdin.reconfigure(encoding="utf-8")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    models_dir = Path(__file__).resolve().parent.parent / "models"
    video_path_str = resolve_video_path()

    # Step 1: Feature Extraction
    try:
        features_dict, frames_sampled, faces_detected = extract_features_from_video(
            video_path=video_path_str,
            models_dir=models_dir,
            num_samples=5,
        )
    except VideoExtractionError as ve:
        respond_error(ve.code, ve.message)
    except Exception as e:
        sys.stderr.write(f"Feature extraction unexpected error: {e}\n")
        respond_error("EXTRACTION_ERROR", f"Failed to extract features: {e}")

    # Step 2: Load Model Artifacts
    model_path = models_dir / "emotion_model.joblib"
    columns_path = models_dir / "emotion_feature_columns.json"

    if not model_path.is_file():
        respond_error("MISSING_ARTIFACTS", f"Emotion model file missing at: {model_path}")
    if not columns_path.is_file():
        respond_error("MISSING_ARTIFACTS", f"Emotion feature columns file missing at: {columns_path}")

    try:
        with open(columns_path, "r", encoding="utf-8") as f:
            expected_columns = json.load(f)
    except Exception as e:
        sys.stderr.write(f"Schema loading error: {e}\n")
        respond_error("SCHEMA_ERROR", "Failed to parse emotion feature columns schema.")

    try:
        import joblib
        import pandas as pd
        model = joblib.load(model_path)
    except Exception as e:
        sys.stderr.write(f"Model loading error: {e}\n")
        respond_error("MODEL_LOAD_ERROR", f"Failed to load emotion model: {e}")

    # Step 3: Inference
    try:
        # Build 1-row DataFrame matching exact column sequence
        input_df = pd.DataFrame([features_dict], columns=expected_columns)
        prediction_labels = model.predict(input_df)
        predicted_label = str(prediction_labels[0])

        probabilities = {}
        if hasattr(model, "predict_proba"):
            probs_array = model.predict_proba(input_df)[0]
            classes = getattr(model, "classes_", [])
            for cls_name, prob in zip(classes, probs_array):
                probabilities[str(cls_name)] = round(float(prob), 4)

    except Exception as e:
        sys.stderr.write(f"Inference execution error: {e}\n")
        respond_error("INFERENCE_ERROR", f"Emotion inference execution failed: {e}")

    respond_success(
        label=predicted_label,
        probabilities=probabilities,
        frames_sampled=frames_sampled,
        faces_detected=faces_detected,
    )


if __name__ == "__main__":
    run_pipeline()
