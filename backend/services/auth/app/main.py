from fastapi import FastAPI

app = FastAPI(title="Transvirex Logistics API")


@app.get("/")
def root():
    return {"status": "ok", "service": "transvirex logistics"}


@app.get("/health")
def health():
    return {"status": "healthy"}
