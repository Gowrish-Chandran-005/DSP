"""
Test Suite for Burnout Model Inference
Covers all 12 validation requirements specified in Phase 3.
"""

import subprocess
import json
import math
import sys
from pathlib import Path

# Paths
INFERENCE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = INFERENCE_DIR.parent
PYTHON_EXE = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
SCRIPT_PATH = INFERENCE_DIR / "predict_burnout.py"
MODELS_DIR = BACKEND_DIR / "models"

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

# Base synthetic fixtures
BASE_FEATURES_A = {
    "age": 21,
    "academic_year": 2,
    "study_hours_per_day": 6.0,
    "exam_pressure": 5.0,
    "academic_performance": 75.0,
    "sleep_hours": 7.0,
    "physical_activity": 4.0,
    "social_support": 5.0,
    "screen_time": 6.0,
    "internet_usage": 5.0,
    "financial_stress": 4.0,
    "family_expectation": 5.0,
    "gender": "Female",
}

BASE_FEATURES_B = {
    **BASE_FEATURES_A,
    "stress_level": 4.5,
    "anxiety_score": 3.2,
    "depression_score": 2.1,
}


def invoke_inference(payload_obj_or_str):
    """Invokes predict_burnout.py via subprocess and parses the JSON output."""
    if isinstance(payload_obj_or_str, (dict, list)):
        input_data = json.dumps(payload_obj_or_str)
    else:
        input_data = str(payload_obj_or_str)

    res = subprocess.run(
        [str(PYTHON_EXE), str(SCRIPT_PATH)],
        input=input_data,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    raw_stdout = res.stdout.strip()
    try:
        parsed_stdout = json.loads(raw_stdout)
    except Exception as e:
        parsed_stdout = None

    return res.returncode, parsed_stdout, raw_stdout, res.stderr


def test_1_models_load():
    """1. Both model artifacts load successfully."""
    import joblib

    ma_path = MODELS_DIR / "burnout_model_a.joblib"
    mb_path = MODELS_DIR / "burnout_model_b.joblib"

    assert ma_path.is_file(), f"Missing {ma_path}"
    assert mb_path.is_file(), f"Missing {mb_path}"

    ma = joblib.load(ma_path)
    mb = joblib.load(mb_path)

    assert hasattr(ma, "predict"), "Model A lacks predict method"
    assert hasattr(mb, "predict"), "Model B lacks predict method"
    assert getattr(ma, "n_features_in_", None) == 15, "Model A n_features_in_ != 15"
    assert getattr(mb, "n_features_in_", None) == 18, "Model B n_features_in_ != 18"


def test_2_model_a_valid_prediction():
    """2. Valid Model A input produces a finite prediction."""
    payload = {"model": "model_a", "features": BASE_FEATURES_A}
    ret, parsed, raw, stderr = invoke_inference(payload)
    assert parsed is not None, f"Failed to parse stdout as JSON: {raw}"
    assert parsed.get("success") is True, f"Expected success: true, got {parsed}"
    assert parsed.get("model") == "model_a", f"Expected model 'model_a', got {parsed.get('model')}"
    pred = parsed.get("prediction")
    assert isinstance(pred, (int, float)) and math.isfinite(pred), f"Invalid prediction: {pred}"


def test_3_model_b_valid_prediction():
    """3. Valid Model B input produces a finite prediction."""
    payload = {"model": "model_b", "features": BASE_FEATURES_B}
    ret, parsed, raw, stderr = invoke_inference(payload)
    assert parsed is not None, f"Failed to parse stdout as JSON: {raw}"
    assert parsed.get("success") is True, f"Expected success: true, got {parsed}"
    assert parsed.get("model") == "model_b", f"Expected model 'model_b', got {parsed.get('model')}"
    pred = parsed.get("prediction")
    assert isinstance(pred, (int, float)) and math.isfinite(pred), f"Invalid prediction: {pred}"


def test_4_all_gender_categories():
    """4. All three gender categories map correctly and produce finite predictions."""
    for gender in ["Female", "Male", "Other"]:
        feats = {**BASE_FEATURES_A, "gender": gender}
        payload = {"model": "model_a", "features": feats}
        ret, parsed, raw, stderr = invoke_inference(payload)
        assert parsed is not None, f"JSON parse error for gender {gender}: {raw}"
        assert parsed.get("success") is True, f"Inference failed for gender {gender}: {parsed}"
        assert math.isfinite(parsed.get("prediction")), f"Non-finite prediction for gender {gender}"


def test_5_missing_fields_rejected():
    """5. Missing required fields are rejected."""
    incomplete = {k: v for k, v in BASE_FEATURES_A.items() if k != "study_hours_per_day"}
    payload = {"model": "model_a", "features": incomplete}
    ret, parsed, raw, stderr = invoke_inference(payload)
    assert parsed is not None, f"JSON parse error: {raw}"
    assert parsed.get("success") is False, "Expected missing field rejection"
    assert parsed["error"]["code"] == "INVALID_INPUT"
    assert "Missing required feature fields" in parsed["error"]["message"]


def test_6_invalid_model_names_rejected():
    """6. Invalid model names are rejected."""
    for bad_model in ["model_c", "logistic_regression", "", None, 123]:
        payload = {"model": bad_model, "features": BASE_FEATURES_A}
        ret, parsed, raw, stderr = invoke_inference(payload)
        assert parsed is not None, f"JSON parse error: {raw}"
        assert parsed.get("success") is False, f"Expected invalid model rejection for {bad_model}"
        assert parsed["error"]["code"] == "INVALID_INPUT"


def test_7_invalid_gender_rejected():
    """7. Invalid gender values are rejected."""
    for bad_gender in ["female", "MALE", "Unknown", "", 12, False, None]:
        feats = {**BASE_FEATURES_A, "gender": bad_gender}
        payload = {"model": "model_a", "features": feats}
        ret, parsed, raw, stderr = invoke_inference(payload)
        assert parsed is not None, f"JSON parse error: {raw}"
        assert parsed.get("success") is False, f"Expected invalid gender rejection for {bad_gender}"
        assert parsed["error"]["code"] == "INVALID_INPUT"
        assert "gender" in parsed["error"]["message"].lower()


def test_8_non_numeric_values_rejected():
    """8. String, boolean, NaN, and infinite numeric inputs are rejected."""
    invalid_values = [
        "7.5",  # string masquerading as number
        True,   # boolean
        False,  # boolean
        float("nan"),
        float("inf"),
        float("-inf"),
        None,
    ]
    for bad_val in invalid_values:
        feats = {**BASE_FEATURES_A, "sleep_hours": bad_val}
        payload = {"model": "model_a", "features": feats}
        ret, parsed, raw, stderr = invoke_inference(payload)
        assert parsed is not None, f"JSON parse error for val {bad_val}: {raw}"
        assert parsed.get("success") is False, f"Expected rejection of value {bad_val}"
        assert parsed["error"]["code"] == "INVALID_INPUT"
        assert "finite numeric value" in parsed["error"]["message"]


def test_9_target_leakage_rejected():
    """9. Target-leakage fields are rejected."""
    leakage_fields = ["mental_health_index", "risk_level", "dropout_risk"]
    for leak in leakage_fields:
        # Leakage inside features
        feats = {**BASE_FEATURES_A, leak: 4.0}
        payload = {"model": "model_a", "features": feats}
        ret, parsed, raw, stderr = invoke_inference(payload)
        assert parsed is not None, f"JSON parse error: {raw}"
        assert parsed.get("success") is False, f"Expected rejection of leakage field {leak}"
        assert parsed["error"]["code"] == "INVALID_INPUT"
        assert leak in parsed["error"]["message"]

        # Leakage at root level
        payload_root = {"model": "model_a", "features": BASE_FEATURES_A, leak: 4.0}
        ret, parsed, raw, stderr = invoke_inference(payload_root)
        assert parsed is not None, f"JSON parse error: {raw}"
        assert parsed.get("success") is False, f"Expected rejection of root leakage field {leak}"
        assert parsed["error"]["code"] == "INVALID_INPUT"
        assert leak in parsed["error"]["message"]


def test_10_malformed_json_handled():
    """10. Malformed JSON is handled safely without unhandled exception."""
    malformed_inputs = [
        "{model: 'model_a' broken json",
        "",
        "   ",
        "<html>not json</html>",
        "[1, 2, 3]",
    ]
    for bad_json in malformed_inputs:
        ret, parsed, raw, stderr = invoke_inference(bad_json)
        assert parsed is not None, f"Malformed input failed to return valid JSON error: {raw}"
        assert parsed.get("success") is False
        assert parsed["error"]["code"] == "INVALID_INPUT"


def test_11_response_contract():
    """11. The response follows the documented JSON contract."""
    # Test success contract
    payload = {"model": "model_a", "features": BASE_FEATURES_A}
    ret, parsed, raw, stderr = invoke_inference(payload)
    assert set(parsed.keys()) == {"success", "model", "prediction"}

    # Test error contract
    payload_err = {"model": "invalid_model", "features": BASE_FEATURES_A}
    ret, parsed_err, raw_err, stderr = invoke_inference(payload_err)
    assert set(parsed_err.keys()) == {"success", "error"}
    assert set(parsed_err["error"].keys()) == {"code", "message"}


def test_12_feature_columns_match_schema():
    """12. Model feature columns match authoritative JSON schema exactly."""
    columns_file = MODELS_DIR / "burnout_feature_columns.json"
    with open(columns_file, "r", encoding="utf-8") as f:
        schema = json.load(f)

    cols_a = schema["model_a"]
    cols_b = schema["model_b"]

    assert len(cols_a) == 15
    assert len(cols_b) == 18

    # Verify model A features
    assert cols_a[:12] == MODEL_A_NUMERIC_FEATURES
    assert cols_a[12:] == ["gender_Female", "gender_Male", "gender_Other"]

    # Verify model B features (stress/anxiety/depression come before gender)
    assert cols_b[:12] == MODEL_A_NUMERIC_FEATURES
    assert cols_b[12:15] == ["stress_level", "anxiety_score", "depression_score"]
    assert cols_b[15:] == ["gender_Female", "gender_Male", "gender_Other"]


def run_all_tests():
    tests = [
        ("Test 1: Model artifacts load", test_1_models_load),
        ("Test 2: Model A valid prediction", test_2_model_a_valid_prediction),
        ("Test 3: Model B valid prediction", test_3_model_b_valid_prediction),
        ("Test 4: All gender categories map to one-hot columns", test_4_all_gender_categories),
        ("Test 5: Missing fields rejected", test_5_missing_fields_rejected),
        ("Test 6: Invalid model names rejected", test_6_invalid_model_names_rejected),
        ("Test 7: Invalid gender rejected", test_7_invalid_gender_rejected),
        ("Test 8: String/boolean/NaN/inf rejected", test_8_non_numeric_values_rejected),
        ("Test 9: Target-leakage fields rejected", test_9_target_leakage_rejected),
        ("Test 10: Malformed JSON handled safely", test_10_malformed_json_handled),
        ("Test 11: Response follows JSON contract", test_11_response_contract),
        ("Test 12: Feature columns match authoritative JSON schema", test_12_feature_columns_match_schema),
    ]

    passed = 0
    failed = 0
    print("=" * 60)
    print("Running Student Burnout Model Inference Test Suite")
    print("=" * 60)

    for name, func in tests:
        try:
            func()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}")
            print(f"       Error: {e}")
            failed += 1

    print("=" * 60)
    print(f"Test Summary: {passed} passed, {failed} failed out of {len(tests)} tests.")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    run_all_tests()
