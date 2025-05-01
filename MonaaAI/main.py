from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import transactions, voice

app = FastAPI(title="Monaa AI Voice & NLP API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api")
app.include_router(voice.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Monaa AI server is running 🚀"}


# cd monaa_ai
# uvicorn main:app --reload