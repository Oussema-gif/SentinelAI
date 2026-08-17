# SentinelAI V1 — Exploratory Data Analysis Report

## 1. Purpose

This report documents the exploratory analysis performed on the UCI SMS Spam Collection dataset before implementing the production preprocessing pipeline.

The purpose of this analysis is to:

- understand the class distribution
- characterize message length
- identify class-associated lexical patterns
- quantify duplicate and normalized-duplicate records
- inspect punctuation, digit, uppercase, and Unicode usage
- convert the observations into explicit preprocessing decisions for Phase 3

The notebook used for this analysis is:

`ml/notebooks/eda.ipynb`

The notebook is exploratory only and is not imported by shipped application or machine-learning code.

## 2. Dataset Overview

Dataset: UCI SMS Spam Collection

Validated dataset size:

- Total messages: 5,574
- Ham: 4,827
- Spam: 747

| Label | Count | Percentage |
|---|---:|---:|
| Ham | 4,827 | 86.5985% |
| Spam | 747 | 13.4015% |

The dataset is materially imbalanced, so accuracy alone should not be used as the primary model-selection criterion in Phase 4.

## 3. Message Length

| Statistic | Ham | Spam |
|---|---:|---:|
| Character count — mean | 71.471929 | 138.676037 |
| Character count — median | 52 | 149 |
| Character count — minimum | 2 | 13 |
| Character count — maximum | 910 | 223 |
| Word count — mean | 14.304123 | 23.911647 |
| Word count — median | 11 | 25 |
| Word count — minimum | 1 | 2 |
| Word count — maximum | 171 | 35 |

Additional character-length percentiles:

| Percentile | Ham | Spam |
|---|---:|---:|
| 25% | 33 | 133 |
| 50% | 52 | 149 |
| 75% | 93 | 157 |
| 95% | 159 | 162 |
| 99% | 288.48 | 174.08 |
| Maximum | 910 | 223 |

### Finding

Spam messages are substantially longer on average and at the median.

Ham also contains a much longer upper tail, reaching 910 characters, while the longest spam message observed is 223 characters.

### Decision

Do not aggressively truncate messages based on typical spam length.

The complete message should remain available to the text pipeline.

## 4. Raw Token Frequency

The exploratory tokenizer used for frequency analysis was:

`[A-Za-z0-9']+`

with lowercase conversion for analysis only.

### Top ham tokens

`i`, `you`, `to`, `the`, `a`, `u`, `and`, `in`, `me`, `my`, `is`, `it`, `of`, `for`, `that`, `have`, `but`, `so`, `not`, `your`, `are`, `on`, `i'm`, `do`, `can`, `at`, `if`, `will`, `be`, `2`.

### Top spam tokens

`to`, `a`, `call`, `you`, `your`, `free`, `2`, `the`, `for`, `now`, `or`, `u`, `txt`, `is`, `on`, `ur`, `4`, `have`, `from`, `mobile`, `text`, `stop`, `and`, `claim`, `1`, `with`, `reply`, `www`, `of`, `prize`.

### Findings

There is substantial overlap in common English and SMS-style words between ham and spam.

Spam also contains distinctive recurring vocabulary associated with promotional language, calls and replies, mobile/SMS terminology, prizes and claims, and web/URL-like content.

### Decision

Do not aggressively remove stopwords.

SMS abbreviations such as `u`, `ur`, and `txt` should remain unchanged.

Do not remove URL-like tokens such as `www`.

## 5. Duplicate Analysis

Phase 1 identified:

- Exact duplicate rows: 403

Conservative analysis normalization consisted of:

- lowercase conversion
- collapsing repeated whitespace
- stripping surrounding whitespace

After normalization:

- Normalized duplicate rows: 415

Normalization therefore revealed 12 additional duplicate rows.

Examples included:

- `sorry, i'll call later` — 30 occurrences
- `i cant pick the phone right now...` — 12 occurrences
- `ok...` — 10 occurrences

### Finding

The repeated records do not provide sufficient evidence to treat all duplicate rows as corrupt data.

### Decision

Do not globally delete duplicates during preprocessing.

The original dataset should remain intact.

Phase 4 must explicitly prevent identical or duplicate-normalized messages from crossing the train/test boundary.

## 6. Punctuation Density

| Statistic | Ham | Spam |
|---|---:|---:|
| Mean | 0.062240 | 0.044174 |
| Median | 0.046512 | 0.042254 |
| Minimum | 0.0 | 0.0 |
| Maximum | 0.857143 | 0.175182 |

### Finding

Punctuation density is not a strong spam-specific signal in this dataset.

### Decision

Do not strip punctuation aggressively.

## 7. Digit Density

| Statistic | Ham | Spam |
|---|---:|---:|
| Mean | 0.004239 | 0.116530 |
| Median | 0.000000 | 0.117284 |
| Minimum | 0.0 | 0.0 |
| Maximum | 1.0 | 0.615385 |

### Finding

Digit density is substantially higher in spam than ham.

### Decision

Preserve digits.

## 8. Uppercase Density

| Statistic | Ham | Spam |
|---|---:|---:|
| Mean | 0.079004 | 0.167310 |
| Median | 0.045455 | 0.148148 |
| Minimum | 0.0 | 0.0 |
| Maximum | 1.0 | 1.0 |

### Finding

Spam has substantially higher average and median uppercase density.

### Decision

Do not assume case normalization is harmless. Phase 3 should initially preserve case information.

## 9. Unicode / Non-ASCII Usage

| Statistic | Ham | Spam |
|---|---:|---:|
| Mean | 0.062358 | 0.444444 |
| Median | 0 | 0 |
| Maximum | 4 | 4 |

Observed examples contained accented characters, `ü`, `£`, curly apostrophes, dashes, and ellipsis characters.

### Finding

Non-ASCII characters are relatively sparse, but they represent legitimate content.

### Decision

Do not force ASCII-only normalization.

## 10. Preprocessing Decisions for Phase 3

| Operation | Decision |
|---|---|
| Aggressive lowercasing | No |
| Aggressive punctuation removal | No |
| Digit removal | No |
| ASCII-only normalization | No |
| Stopword removal | No |
| SMS abbreviation expansion | No |
| URL removal | No |
| Aggressive message truncation | No |
| Global duplicate deletion | No |
| Conservative whitespace normalization | Yes |
| Duplicate-aware evaluation | Required |

### Rationale

The corpus contains useful information in digits, capitalization, punctuation, SMS-specific vocabulary, URL-like tokens, and Unicode characters.

Therefore preprocessing should be conservative and focus on safe normalization.

## 11. Constraints for Phase 3

Phase 3 must implement the selected preprocessing inside a single sklearn `Pipeline`.

Required properties:

1. Text cleaning is part of the pipeline.
2. TF-IDF is fit only on training data within each cross-validation fold.
3. The complete preprocessing, vectorization, and classifier chain is the serialized model artifact.
4. Inference reuses exactly the same pipeline.
5. Production code does not depend on notebook-only preprocessing.
6. Tests verify consistent preprocessing between training and inference.

## 12. Known Data Limitations

- Ham: 86.5985%
- Spam: 13.4015%
- Exact duplicates: 403
- Normalized duplicates: 415

These characteristics require careful evaluation design.

The EDA findings are descriptive and do not establish that any individual feature is independently causal or universally predictive.

## 13. Phase 2 Conclusion

The exploratory analysis supports a conservative text-preprocessing strategy.

Key observations:

- spam messages are substantially longer on average
- spam contains substantially more digits
- spam contains substantially more uppercase characters
- spam-specific vocabulary includes promotional, mobile, reply, and prize-related terms
- Unicode is present and should not be discarded
- duplicate content is common enough to require duplicate-aware evaluation

These findings are the documented preprocessing basis for Phase 3.
