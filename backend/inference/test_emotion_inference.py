"""
Test Suite for Visual Emotion Inference Pipeline
Validates model loading, schema integrity, MediaPipe feature extraction,
video handling, edge cases, error contracts, and resource cleanup.
"""

import os
import sys
import json
import math
import tempfile
import subprocess
from pathlib import Path

import cv2
import numpy as np

# Paths
INFERENCE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = INFERENCE_DIR.parent
PYTHON_EXE = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
SCRIPT_PATH = INFERENCE_DIR / "predict_emotion.py"
MODELS_DIR = BACKEND_DIR / "models"
SAMPLE_VIDEO_PATH = Path("D:/dsp project 2/video/vidssave.com Proper Webcam Placement for Virtual Meeting 720P.mp4")

EXPECTED_CLASSES = ["Anger", "Confusion", "Disgust", "Happiness", "Neutral", "Surprise"]


def invoke_emotion_cli(arg_or_stdin, use_stdin=False):
    """Invokes predict_emotion.py via subprocess and parses stdout JSON."""
    cmd = [str(PYTHON_EXE), str(SCRIPT_PATH)]
    input_str = None
    if not use_stdin:
        cmd.append(str(arg_or_stdin))
    else:
        input_str = json.dumps({"video_path": str(arg_or_stdin)})

    res = subprocess.run(
        cmd,
        input=input_str,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    raw_stdout = res.stdout.strip()
    try:
        parsed_stdout = json.loads(raw_stdout)
    except Exception:
        parsed_stdout = None

    return res.returncode, parsed_stdout, raw_stdout, res.stderr


def test_1_emotion_model_loads():
    """1. Emotion model loads successfully."""
    import joblib

    model_path = MODELS_DIR / "emotion_model.joblib"
    assert model_path.is_file(), f"Missing model file: {model_path}"
    model = joblib.load(model_path)
    assert hasattr(model, "predict"), "Model missing predict method"
    assert hasattr(model, "predict_proba"), "Model missing predict_proba method"


def test_2_feature_schema_104_unique():
    """2. The feature schema contains exactly 104 unique features."""
    cols_path = MODELS_DIR / "emotion_feature_columns.json"
    assert cols_path.is_file(), f"Missing columns file: {cols_path}"
    with open(cols_path, "r", encoding="utf-8") as f:
        cols = json.load(f)

    assert isinstance(cols, list), "Schema must be a list"
    assert len(cols) == 104, f"Expected 104 features, got {len(cols)}"
    assert len(set(cols)) == 104, "Features in schema must be unique"


def test_3_model_class_labels_match():
    """3. Model class labels match the loaded classifier."""
    import joblib

    model = joblib.load(MODELS_DIR / "emotion_model.joblib")
    classes = list(getattr(model, "classes_", []))
    assert classes == EXPECTED_CLASSES, f"Classes {classes} do not match expected {EXPECTED_CLASSES}"


def test_4_feature_extraction_length_and_order():
    """4. Feature extraction produces correct vector length and order on sample video."""
    assert SAMPLE_VIDEO_PATH.is_file(), f"Sample video missing at: {SAMPLE_VIDEO_PATH}"

    from extract_emotion_features import extract_features_from_video

    features_dict, frames_sampled, faces_detected = extract_features_from_video(
        video_path=str(SAMPLE_VIDEO_PATH),
        models_dir=MODELS_DIR,
        num_samples=5,
    )

    with open(MODELS_DIR / "emotion_feature_columns.json", "r", encoding="utf-8") as f:
        expected_cols = json.load(f)

    assert len(features_dict) == 104, f"Extracted {len(features_dict)} features, expected 104"
    assert set(features_dict.keys()) == set(expected_cols), "Feature keys do not match schema"
    assert frames_sampled == 5, f"Expected 5 frames sampled, got {frames_sampled}"
    assert faces_detected > 0, f"Expected faces detected, got {faces_detected}"

    # Verify all feature values are finite floats
    for k, v in features_dict.items():
        assert isinstance(v, (int, float)) and math.isfinite(v), f"Feature {k} is not finite: {v}"


def test_5_inference_result_json_contract():
    """5. The inference result follows the documented JSON contract."""
    ret, parsed, raw, stderr = invoke_emotion_cli(SAMPLE_VIDEO_PATH)
    assert parsed is not None, f"Failed to parse stdout JSON: {raw}"
    assert parsed.get("success") is True, f"Expected success: true, got {parsed}"
    assert parsed.get("model") == "emotion_svm"

    pred = parsed.get("prediction", {})
    assert pred.get("label") in EXPECTED_CLASSES
    probs = pred.get("class_probabilities", {})
    assert len(probs) == len(EXPECTED_CLASSES)
    assert set(probs.keys()) == set(EXPECTED_CLASSES)
    assert sum(probs.values()) > 0.95 and sum(probs.values()) < 1.05  # Normalized probabilities
    assert pred.get("frames_sampled") == 5
    assert pred.get("faces_detected") > 0


def test_6_missing_video_path_rejected():
    """6. Missing video paths are rejected with structured error."""
    non_existent = "D:/dsp project 2/video/does_not_exist_xyz.mp4"
    ret, parsed, raw, stderr = invoke_emotion_cli(non_existent)
    assert parsed is not None, f"Expected JSON error response: {raw}"
    assert parsed.get("success") is False
    assert parsed["error"]["code"] == "INVALID_VIDEO"


def test_7_invalid_video_file_rejected():
    """7. Corrupted or invalid video files are rejected."""
    # Create a dummy text file with .mp4 extension
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
        tf.write(b"NOT A REAL VIDEO FILE CONTENT")
        temp_path = tf.name

    try:
        ret, parsed, raw, stderr = invoke_emotion_cli(temp_path)
        assert parsed is not None, f"Expected JSON response: {raw}"
        assert parsed.get("success") is False
        assert parsed["error"]["code"] in ("INVALID_VIDEO", "EMPTY_VIDEO")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_8_no_face_detected_structured_error():
    """8. A video with no detected face returns structured NO_FACE_DETECTED error."""
    # Generate a small 10-frame completely black video where no face can be detected
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
        temp_video = tf.name

    try:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(temp_video, fourcc, 10.0, (320, 240))
        blank_frame = np.zeros((240, 320, 3), dtype=np.uint8)
        for _ in range(10):
            out.write(blank_frame)
        out.release()

        ret, parsed, raw, stderr = invoke_emotion_cli(temp_video)
        assert parsed is not None, f"Expected JSON response: {raw}"
        assert parsed.get("success") is False, "Expected failure when no face detected"
        assert parsed["error"]["code"] == "NO_FACE_DETECTED", f"Got code: {parsed['error']['code']}"
    finally:
        if os.path.exists(temp_video):
            os.remove(temp_video)


def test_9_non_finite_features_handling():
    """9. Non-finite features are handled safely by imputer pipeline."""
    import joblib
    import pandas as pd

    model = joblib.load(MODELS_DIR / "emotion_model.joblib")
    with open(MODELS_DIR / "emotion_feature_columns.json", "r") as f:
        cols = json.load(f)

    # DataFrame with NaNs to verify SimpleImputer step in pipeline
    df_nan = pd.DataFrame([{c: float("nan") for c in cols}], columns=cols)
    pred = model.predict(df_nan)
    assert pred[0] in EXPECTED_CLASSES, "SimpleImputer step failed on NaNs"


def test_10_resource_cleanup():
    """10. OpenCV and MediaPipe resources are released properly on success and error."""
    from extract_emotion_features import extract_features_from_video, VideoExtractionError

    # Success case cleanup
    features_dict, sampled, detected = extract_features_from_video(
        video_path=str(SAMPLE_VIDEO_PATH),
        models_dir=MODELS_DIR,
        num_samples=5,
    )
    assert len(features_dict) == 104
    assert detected > 0

    # Failure case cleanup (missing video)
    try:
        extract_features_from_video("non_existent_file.mp4", models_dir=MODELS_DIR)
        assert False, "Should have raised VideoExtractionError"
    except VideoExtractionError:
        pass  # Successfully caught and handled


def run_all_tests():
    tests = [
        ("Test 1: Emotion model loads successfully", test_1_emotion_model_loads),
        ("Test 2: Schema contains 104 unique features", test_2_feature_schema_104_unique),
        ("Test 3: Model class labels match expected", test_3_model_class_labels_match),
        ("Test 4: Feature extraction vector length & order", test_4_feature_extraction_length_and_order),
        ("Test 5: Inference result follows JSON contract", test_5_inference_result_json_contract),
        ("Test 6: Missing video paths rejected", test_6_missing_video_path_rejected),
        ("Test 7: Invalid/corrupt video rejected", test_7_invalid_video_file_rejected),
        ("Test 8: No-face video returns structured error", test_8_no_face_detected_structured_error),
        ("Test 9: Non-finite feature handling via imputer", test_9_non_finite_features_handling),
        ("Test 10: Resource cleanup on success and error", test_10_resource_cleanup),
    ]

    print("=" * 65)
    print("Running Visual Emotion Inference Test Suite")
    print("=" * 65)

    passed = 0
    failed = 0

    for name, func in tests:
        try:
            func()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}")
            print(f"       Error: {e}")
            failed += 1

    print("=" * 65)
    print(f"Test Summary: {passed} passed, {failed} failed out of {len(tests)} tests.")
    print("=" * 65)

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    run_all_tests()
