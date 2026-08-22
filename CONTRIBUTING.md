# Contributing to SentinelAI

## Development workflow

1. Create a feature branch from the default branch.
2. Keep changes focused and update relevant documentation.
3. Run the complete verification suite before opening a pull request:

```bash
./scripts/test-all.sh
```

4. Run the live smoke test when the local container stack is running:

```bash
./scripts/smoke-test.sh
```

## Requirements

- Never commit `.env` files, database credentials, private API keys, raw datasets, generated model artifacts, build directories, or caches.
- Keep ML preprocessing inside the shared scikit-learn pipeline.
- Preserve duplicate-aware train/test separation for model evaluation.
- Do not represent a Linear SVM decision score as a calibrated probability.
- Add or update tests for behavior changes.

## Commit messages

Use concise imperative messages, for example:

```text
Add threat timeline API tests
Fix production CORS configuration
Document model artifact release process
```
