#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8080/api}"

echo "SentinelAI API smoke test"
echo "BASE_URL=$BASE_URL"
echo

echo "[1] Health"
curl -fsS "$BASE_URL/health" | python -m json.tool
echo

echo "[2] Model info"
curl -fsS "$BASE_URL/model/info" | python -m json.tool
echo

echo "[3] Spam prediction"
curl -fsS -X POST \
  "$BASE_URL/predictions" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "URGENT! You have won £500. Claim now at https://bit.ly/win500",
    "top_k": 6
  }' | python -m json.tool
echo

echo "[4] Ham prediction"
curl -fsS -X POST \
  "$BASE_URL/predictions" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hey, are you free tonight?",
    "top_k": 6
  }' | python -m json.tool
echo

echo "[5] Prediction history"
curl -fsS \
  "$BASE_URL/predictions" \
  | python -m json.tool
echo

echo "[6] Usage analytics"
curl -fsS \
  "$BASE_URL/analytics/usage" \
  | python -m json.tool
echo

echo "SMOKE TEST PASSED"
