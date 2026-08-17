# SentinelAI V1 — Model Comparison

## Dataset and Evaluation Protocol

- Dataset SHA-256: `7d039a24a6083ed9ef0f806ebad56bbb976e3aeb8de05669173bfdc4996c239d`
- Total records: 5,574
- Development records: 4,459
- Final holdout records: 1,115
- CV strategy: StratifiedGroupKFold
- CV folds: 5
- Random seed: 42
- Group key: conservative normalized message

The final holdout was isolated before model comparison and was not used for model selection or hyperparameter tuning.

## Model Selection Policy

The dataset contains 13.4015% spam and 86.5985% ham. Accuracy is therefore not sufficient as the primary selection criterion.

For V1, F1 is the primary selection metric because no production operator has supplied an asymmetric false-positive/false-negative cost matrix. Precision, recall, and PR-AUC remain mandatory secondary measures.

If deployment requirements later establish a different operational cost, the selection rule should be revisited rather than silently changing it.

## Cross-Validation Results

| Model | Precision | Recall | F1 | PR-AUC | F1 Std |
|---|---:|---:|---:|---:|---:|
| Linear SVM | 0.975900 | 0.924636 | 0.949272 | 0.981990 | 0.007314 |
| Logistic Regression | 0.947588 | 0.936387 | 0.941896 | 0.978554 | 0.010294 |
| Multinomial Naive Bayes | 0.983823 | 0.896246 | 0.937605 | 0.978792 | 0.014893 |

## Selected Model

**Linear SVM**

Selection was made from the cross-validation comparison above using mean F1 as the primary criterion, with PR-AUC as a secondary tie-break.

Best hyperparameters:

```json
{
  "classifier__C": 2.0,
  "classifier__class_weight": "balanced"
}
```

## Final Held-Out Test Metrics

| Metric | Value |
|---|---:|
| accuracy | 0.988341 |
| precision | 1.000000 |
| recall | 0.913333 |
| f1 | 0.954704 |
| pr_auc | 0.968298 |

## Calibration Audit

```json
{
  "available": false,
  "approved": false,
  "reason": "Selected classifier has no native predict_proba.",
  "confidence_type": "decision_score_or_none"
}
```

User-facing confidence is not approved merely because a classifier implements `predict_proba`. Calibration must be reviewed and, if necessary, explicitly calibrated before a probability is exposed.

## Limitations

- Benchmark performance does not establish production performance.
- The dataset is English-language and consists of short messages.
- Duplicate-aware evaluation reduces contamination but does not eliminate domain-shift risk.
- V1 does not include phishing, malicious URL, or multi-class threat detection.
