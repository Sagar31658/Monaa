from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import transaction, voice

app = FastAPI(title="Monaa AI Voice & NLP API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(transaction.router, prefix="/api")
app.include_router(voice.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Monaa AI NLP/Voice server is live 🚀"}
