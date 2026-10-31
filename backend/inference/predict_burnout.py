#!/usr/bin/env python3
"""
Student Burnout Inference Module
Performs validation and model prediction for Model A and Model B using
the trained scikit-learn HistGradientBoostingRegressor artifacts.
"""

import sys
import os
import json
import math
from pathlib import Path

# Target leakage columns strictly prohibited as model inputs
PROHIBITED_LEAKAGE_FEATURES = {"mental_health_index", "risk_level", "dropout_risk"}

# Expected raw input fields for each model
MODEL_A_NUMERIC_FEATURES = [
    "age",
    "academic_year",
    "study_hours_per_day",
    "exam_pressure",
    "academic_performance",
    "sleep_hours",
    "physical_activity",
    "social_support",
    "screen_time",
    "internet_usage",
    "financial_stress",
    "family_expectation",
]

MODEL_B_EXTRA_NUMERIC = [
    "stress_level",
    "anxiety_score",
    "depression_score",
]

MODEL_B_NUMERIC_FEATURES = MODEL_A_NUMERIC_FEATURES + MODEL_B_EXTRA_NUMERIC

VALID_GENDERS = {"Female", "Male", "Other"}


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


def respond_success(model_name: str, prediction: float):
    """Write standardized success JSON to stdout and exit."""
    payload = {
        "success": True,
        "model": model_name,
        "prediction": round(float(prediction), 4),
    }
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()
    sys.exit(0)


def validate_and_preprocess(raw_data: dict, models_dir: Path):
    """
    Validates input schema, rejects missing/extra/leakage fields,
    and returns a pandas DataFrame formatted for inference.
    """
    if not isinstance(raw_data, dict):
        respond_error("INVALID_INPUT", "Request body must be a JSON object.")

    # Check for target leakage anywhere in the top-level keys
    for leak in PROHIBITED_LEAKAGE_FEATURES:
        if leak in raw_data:
            respond_error(
                "INVALID_INPUT",
                f"Prohibited target-leakage feature '{leak}' was provided.",
            )

    model_name = raw_data.get("model")
    if model_name not in ("model_a", "model_b"):
        respond_error(
            "INVALID_INPUT",
            f"Invalid or missing 'model' field. Expected 'model_a' or 'model_b', got: '{model_name}'.",
        )

    features = raw_data.get("features")
    if not isinstance(features, dict):
        respond_error("INVALID_INPUT", "The 'features' object is required and must be a dictionary.")

    # Check for target leakage in features dict
    for leak in PROHIBITED_LEAKAGE_FEATURES:
        if leak in features:
            respond_error(
                "INVALID_INPUT",
                f"Prohibited target-leakage feature '{leak}' found in features.",
            )

    expected_numeric = MODEL_A_NUMERIC_FEATURES if model_name == "model_a" else MODEL_B_NUMERIC_FEATURES
    expected_all = set(expected_numeric) | {"gender"}

    provided_keys = set(features.keys())

    # Check for unexpected fields
    unexpected_keys = provided_keys - expected_all
    if unexpected_keys:
        respond_error(
            "INVALID_INPUT",
            f"Unexpected feature fields provided for {model_name}: {sorted(list(unexpected_keys))}.",
        )

    # Check for missing fields
    missing_keys = expected_all - provided_keys
    if missing_keys:
        respond_error(
            "INVALID_INPUT",
            f"Missing required feature fields for {model_name}: {sorted(list(missing_keys))}.",
        )

    # Validate numeric fields
    row_dict = {}
    for col in expected_numeric:
        val = features.get(col)
        # Reject booleans (which are instances of int in Python), non-numbers, NaN, infinity
        if isinstance(val, bool) or not isinstance(val, (int, float)) or not math.isfinite(val):
            respond_error(
                "INVALID_INPUT",
                f"Feature '{col}' must be a finite numeric value. Got: {repr(val)}.",
            )
        row_dict[col] = float(val)

    # Validate gender
    gender = features.get("gender")
    if not isinstance(gender, str) or gender not in VALID_GENDERS:
        respond_error(
            "INVALID_INPUT",
            f"Field 'gender' must be one of {sorted(list(VALID_GENDERS))}. Got: {repr(gender)}.",
        )

    # Convert gender to one-hot columns
    row_dict["gender_Female"] = 1.0 if gender == "Female" else 0.0
    row_dict["gender_Male"] = 1.0 if gender == "Male" else 0.0
    row_dict["gender_Other"] = 1.0 if gender == "Other" else 0.0

    # Load authoritative column sequence from burnout_feature_columns.json
    columns_file = models_dir / "burnout_feature_columns.json"
    if not columns_file.is_file():
        respond_error("MISSING_ARTIFACTS", f"Feature columns file not found at: {columns_file}")

    try:
        with open(columns_file, "r", encoding="utf-8") as f:
            all_columns = json.load(f)
        ordered_columns = all_columns.get(model_name)
        if not isinstance(ordered_columns, list) or len(ordered_columns) == 0:
            raise ValueError(f"Invalid column configuration for {model_name}.")
    except Exception as e:
        sys.stderr.write(f"Error reading feature columns: {e}\n")
        respond_error("MODEL_LOAD_ERROR", f"Failed to parse feature columns schema for {model_name}.")

    # Import pandas and build DataFrame matching authoritative order exactly
    try:
        import pandas as pd
        df = pd.DataFrame([row_dict], columns=ordered_columns)
    except Exception as e:
        sys.stderr.write(f"DataFrame construction error: {e}\n")
        respond_error("INFERENCE_ERROR", "Failed to construct input tensor DataFrame.")

    return model_name, df


def run_prediction():
    """Main execution entry point."""
    # Ensure UTF-8 I/O
    if hasattr(sys.stdin, "reconfigure"):
        sys.stdin.reconfigure(encoding="utf-8")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    models_dir = Path(__file__).resolve().parent.parent / "models"

    raw_input_text = sys.stdin.read().strip()
    if not raw_input_text:
        respond_error("INVALID_INPUT", "Empty input received on standard input.")

    try:
        raw_data = json.loads(raw_input_text)
    except Exception as e:
        sys.stderr.write(f"JSON parse error: {e}\n")
        respond_error("INVALID_INPUT", "Invalid JSON payload provided on standard input.")

    model_name, input_df = validate_and_preprocess(raw_data, models_dir)

    model_filename = "burnout_model_a.joblib" if model_name == "model_a" else "burnout_model_b.joblib"
    model_path = models_dir / model_filename

    if not model_path.is_file():
        respond_error("MISSING_ARTIFACTS", f"Model file not found: {model_filename}")

    try:
        import joblib
        model = joblib.load(model_path)
    except Exception as e:
        sys.stderr.write(f"Model loading error for {model_filename}: {e}\n")
        respond_error("MODEL_LOAD_ERROR", f"Failed to load {model_filename} artifact.")

    try:
        prediction_array = model.predict(input_df)
        pred_value = float(prediction_array[0])
        if not math.isfinite(pred_value):
            raise ValueError("Prediction result is not a finite number.")
    except Exception as e:
        sys.stderr.write(f"Prediction execution error: {e}\n")
        respond_error("INFERENCE_ERROR", f"Prediction execution failed for {model_name}.")

    respond_success(model_name, pred_value)


if __name__ == "__main__":
    run_prediction()
