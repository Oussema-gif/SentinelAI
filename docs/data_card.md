# SentinelAI V1 — Data Card

## Dataset

SMS Spam Collection

## Primary Source

UCI Machine Learning Repository

Dataset ID: 228

Source:
https://archive.ics.uci.edu/dataset/228/sms+spam+collection

## Citation

Almeida, T. & Hidalgo, J. (2011).
SMS Spam Collection.
UCI Machine Learning Repository.

DOI:
https://doi.org/10.24432/C5CC84

## License

Creative Commons Attribution 4.0 International (CC BY 4.0).

SentinelAI must retain appropriate attribution to the dataset creators and UCI.

## Dataset Characteristics

- Instances: 5,574
- Missing values reported by UCI: No
- Data type: Text
- Tasks: Classification, Clustering
- Primary V1 task: Binary spam/ham classification

## Dataset Format

The primary collection is a text file in which each line contains:

<label> <raw message>

The expected labels are:

- ham
- spam

## Acquisition

The dataset is acquired programmatically from the UCI Machine Learning Repository.

The retrieval date and archive SHA-256 hash will be recorded during acquisition.

## Data Quality Checks

SentinelAI validation will check:

- file presence
- file encoding
- schema
- supported labels
- missing values
- empty messages
- duplicate records
- class distribution
- message-length distribution

## Privacy / Provenance Note

The UCI documentation describes the corpus as assembled from multiple public or research sources and notes that volunteers contributing NUS SMS messages were informed that their contributions would be publicly available.

The raw dataset is therefore treated as third-party research data, not as user-generated SentinelAI production data.

## SentinelAI Validation Results

Validation run: August 17, 2026

- Total rows: 5,574
- Ham: 4,827 (86.5985%)
- Spam: 747 (13.4015%)
- Duplicate rows: 403
- Minimum message length: 2 characters
- Maximum message length: 910 characters
- Mean message length: 80.4783 characters
- Median message length: 62 characters

The duplicate count is reported as a data-quality finding rather than causing
validation failure. Downstream train/test splitting and evaluation must prevent
duplicate contamination between training and evaluation data.
