from fastapi import FastAPI

app = FastAPI(
    title="SentinelAI API",
    version="0.1.0",
    description="Message threat detection API.",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
