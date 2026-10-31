"""
Facial Blendshape Feature Extraction Module
Extracts 104 facial blendshape statistical features (52 means, 52 stds)
from sampled video frames using MediaPipe FaceLandmarker.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any

import cv2
import numpy as np


class VideoExtractionError(Exception):
    """Custom exception for video decoding and face extraction errors."""
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def get_sampling_frame_indices(total_frames: int, num_samples: int = 5) -> List[int]:
    """
    Computes deterministic frame indices spaced evenly across video duration.
    If total_frames <= num_samples, samples every frame.
    """
    if total_frames <= 0:
        return []
    if total_frames <= num_samples:
        return list(range(total_frames))
    return [int(round(i * (total_frames - 1) / (num_samples - 1))) for i in range(num_samples)]


def extract_features_from_video(
    video_path: str,
    models_dir: Path = None,
    num_samples: int = 5,
) -> Tuple[Dict[str, float], int, int]:
    """
    Extracts 104 ordered facial blendshape features from video.
    
    Returns:
        (features_dict, frames_sampled_count, faces_detected_count)
    Raises:
        VideoExtractionError on invalid video, missing task file, or no face detected.
    """
    if models_dir is None:
        models_dir = Path(__file__).resolve().parent.parent / "models"

    v_path = Path(video_path)
    if not v_path.is_file():
        raise VideoExtractionError(
            "INVALID_VIDEO",
            f"Video file not found at path: {video_path}",
        )

    task_path = models_dir / "face_landmarker.task"
    if not task_path.is_file():
        raise VideoExtractionError(
            "MISSING_ARTIFACTS",
            f"FaceLandmarker task model missing at: {task_path}",
        )

    columns_file = models_dir / "emotion_feature_columns.json"
    if not columns_file.is_file():
        raise VideoExtractionError(
            "MISSING_ARTIFACTS",
            f"Feature columns schema missing at: {columns_file}",
        )

    try:
        with open(columns_file, "r", encoding="utf-8") as f:
            expected_columns = json.load(f)
        if not isinstance(expected_columns, list) or len(expected_columns) != 104:
            raise ValueError("Schema must contain exactly 104 columns.")
    except Exception as e:
        raise VideoExtractionError(
            "SCHEMA_ERROR",
            f"Failed to parse emotion feature columns schema: {e}",
        )

    # Initialize MediaPipe FaceLandmarker
    try:
        import mediapipe as mp
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        base_options = python.BaseOptions(model_asset_path=str(task_path))
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=False,
            num_faces=1,
            running_mode=vision.RunningMode.IMAGE,
        )
        detector = vision.FaceLandmarker.create_from_options(options)
    except Exception as e:
        sys.stderr.write(f"MediaPipe initialization error: {e}\n")
        raise VideoExtractionError(
            "LANDMARKER_INIT_ERROR",
            f"Failed to initialize MediaPipe FaceLandmarker: {e}",
        )

    cap = None
    detected_blendshapes: List[Dict[str, float]] = []
    sampled_indices: List[int] = []

    try:
        cap = cv2.VideoCapture(str(v_path))
        if not cap.isOpened():
            raise VideoExtractionError(
                "INVALID_VIDEO",
                f"Unable to open or decode video file: {video_path}",
            )

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            raise VideoExtractionError(
                "EMPTY_VIDEO",
                "Video file contains 0 readable frames.",
            )

        sampled_indices = get_sampling_frame_indices(total_frames, num_samples)

        for frame_idx in sampled_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                continue

            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

            result = detector.detect(mp_image)
            if result.face_blendshapes and len(result.face_blendshapes) > 0:
                face_shapes = {
                    cat.category_name: float(cat.score)
                    for cat in result.face_blendshapes[0]
                }
                detected_blendshapes.append(face_shapes)

    except VideoExtractionError:
        raise
    except Exception as e:
        sys.stderr.write(f"Frame processing error: {e}\n")
        raise VideoExtractionError(
            "PROCESSING_ERROR",
            f"Error occurred during video frame extraction: {e}",
        )
    finally:
        if cap is not None:
            cap.release()
        detector.close()

    faces_detected = len(detected_blendshapes)
    frames_sampled = len(sampled_indices)

    if faces_detected == 0:
        raise VideoExtractionError(
            "NO_FACE_DETECTED",
            f"No human face was detected in any of the {frames_sampled} sampled video frames.",
        )

    # Compute 104 features: population mean and population std (ddof=0)
    features_dict: Dict[str, float] = {}

    # Extract base blendshape names from schema
    base_names = [col[len("blend_") : -len("_mean")] for col in expected_columns if col.endswith("_mean")]

    for name in base_names:
        vals = [face_dict.get(name, 0.0) for face_dict in detected_blendshapes]
        mean_val = float(np.mean(vals))
        std_val = float(np.std(vals, ddof=0))

        features_dict[f"blend_{name}_mean"] = mean_val
        features_dict[f"blend_{name}_std"] = std_val

    return features_dict, frames_sampled, faces_detected
