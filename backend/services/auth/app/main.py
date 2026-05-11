from fastapi import FastAPI

app = FastAPI(title="Transvirex Auth Service")


@app.get("/")
def root():
    return {"service": "auth", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
