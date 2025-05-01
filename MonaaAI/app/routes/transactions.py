from fastapi import APIRouter
from app.schemas.transaction import TransactionRequest, TransactionResponse
from app.services.inference import extract_transaction_details

router = APIRouter(tags=["Transaction NLP"])

@router.post("/predict-text", response_model=TransactionResponse)
def predict_from_text(req: TransactionRequest):
    parsed = extract_transaction_details(req.text)
    return {"raw_output": str(parsed)}
