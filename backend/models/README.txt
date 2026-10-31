STUDENT BURNOUT MODEL BUNDLE

Files:
- burnout_model_a.joblib: academic/lifestyle model
- burnout_model_b.joblib: model with stress/anxiety/depression inputs
- burnout_feature_columns.json: exact ordered tabular feature lists
- emotion_model.joblib: visual emotion classifier
- emotion_feature_columns.json: exact ordered 104 visual features
- face_landmarker.task: MediaPipe face landmark model, if included
- model_metadata.json: metrics and limitations

Python loading example:
import joblib, json

model_a = joblib.load("burnout_model_a.joblib")
model_b = joblib.load("burnout_model_b.joblib")
emotion_model = joblib.load("emotion_model.joblib")

with open("burnout_feature_columns.json") as f:
    tabular_features = json.load(f)

with open("emotion_feature_columns.json") as f:
    emotion_features = json.load(f)

For predictions, construct a pandas DataFrame using the exact
feature names and order required by the corresponding model.

Do not combine emotion classes with burnout scores as if they
were the same target. The visual model requires video feature
extraction before prediction.
