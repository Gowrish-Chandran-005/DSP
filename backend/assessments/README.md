# Calma Assessment Questionnaire Library
## Faculty Demonstration & Academic Research Guide

This directory contains the machine-readable JSON definitions of all questionnaires designed for the **Student Burnout Risk Estimation & Early-Warning System (`Calma`)**.

---

## 1. Directory Structure

```
backend/assessments/
├── assessment-index.json             # Manifest of all registered questionnaires
├── student-burnout-screening.json    # 8-question academic burnout & strain screening
├── study-habits.json                 # 8-question study pacing, duration & break habits
├── sleep-and-recovery.json           # 6-question circadian sleep & recovery reflection
├── academic-workload.json            # 7-question term workload, credit rigor & support
├── optional-daily-check-in.json      # 6-question quick daily student pulse
└── README.md                         # Faculty demonstration guide & schema documentation
```

---

## 2. Assessment Inventory

| File | Title | Questions | Est. Time | Model Mapping | Validation Status |
|---|---|---|---|---|---|
| `student-burnout-screening.json` | Student Burnout & Academic Strain Screening | 8 | 5 min | `stress_level`, `exam_pressure`, `anxiety_score`, `depression_score`, `social_support` | Project-created screening; non-diagnostic |
| `study-habits.json` | Study Habits & Workload Assessment | 8 | 4 min | `study_hours_per_day`, `exam_pressure` | Empirical self-reported study habits |
| `sleep-and-recovery.json` | Sleep & Recovery Assessment | 6 | 3 min | `sleep_hours`, `anxiety_score` | Educational self-reflection questionnaire |
| `academic-workload.json` | Academic Workload & Context Assessment | 7 | 4 min | `exam_pressure`, `financial_stress`, `family_expectation` | Curricular workload self-audit |
| `optional-daily-check-in.json` | Optional Daily Student Check-In | 6 | 1 min | Contextual dashboard tips | Formative micro-reflection; unscored |

---

## 3. JSON Schema Specification

Each assessment file follows a strict schema designed for programmatic parsing:

```json
{
  "assessment_id": "string (unique kebab-case identifier)",
  "title": "string (human-readable title)",
  "version": "string (semantic versioning e.g. 1.0.0)",
  "purpose": "string (educational and functional rationale)",
  "description": "string (detailed summary)",
  "target_population": "string",
  "estimated_duration_minutes": 5,
  "instructions": "string (student guidance)",
  "source": "string (provenance or conceptual foundation)",
  "validation_status": "string (explicit scientific classification)",
  "disclaimer": "string (non-clinical, non-diagnostic ethical boundary)",
  "scoring": {
    "type": "string",
    "scale_range": "string",
    "interpretation": "string"
  },
  "questions": [
    {
      "id": "string (unique question key)",
      "text": "string (exact prompt shown to the student)",
      "category": "string (construct name e.g. Emotional Exhaustion)",
      "response_type": "likert_scale | numeric_range | numeric_input | multiple_choice",
      "scale_min": 1,
      "scale_max": 5,
      "scale_labels": { "1": "Never", "5": "Always" },
      "required": true,
      "model_input_feature_mapping": "stress_level"
    }
  ]
}
```

---

## 4. Relationship to Machine Learning Models

### Tabular Regressor (Model B)
Our primary predictive model is a scikit-learn `HistGradientBoostingRegressor` trained on 18 tabular features. The questionnaires in this library map directly to those features:
1. `study_hours_per_day` $\leftarrow$ `study-habits.json` (`habits_q1`)
2. `exam_pressure` $\leftarrow$ `student-burnout-screening.json` (`burnout_q5`)
3. `sleep_hours` $\leftarrow$ `sleep-and-recovery.json` (`sleep_q1`)
4. `social_support` $\leftarrow$ `student-burnout-screening.json` (`burnout_q8`)
5. `financial_stress` $\leftarrow$ `academic-workload.json` (`workload_q4`)
6. `family_expectation` $\leftarrow$ `academic-workload.json` (`workload_q3`)
7. `stress_level` $\leftarrow$ `student-burnout-screening.json` (`burnout_q1`)
8. `anxiety_score` $\leftarrow$ `student-burnout-screening.json` (`burnout_q7`)
9. `depression_score` $\leftarrow$ `student-burnout-screening.json` (`burnout_q2`)

### Non-Diagnostic Boundary
- Questions do **not** claim to diagnose clinical psychiatric disorders (major depressive disorder, generalized anxiety disorder, or clinical insomnia).
- Continuous outputs from Model B (0.0 to 10.0) indicate statistical risk tiers to encourage early rest, workload redistribution, and student advising.

---

## 5. API Endpoints

The Express backend exposes read-only endpoints to inspect these definitions:
- `GET /api/assessments-library` - Returns `assessment-index.json`
- `GET /api/assessments-library/:id` - Returns the full assessment JSON for the specified ID (e.g. `student-burnout-screening`) with strict path traversal protection.
