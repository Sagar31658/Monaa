from fastapi import APIRouter
from app.models.t5_model import predict_transaction
from app.schemas.transaction import TransactionRequest, TransactionResponse

router = APIRouter(tags=["Transaction NLP"])

@router.post("/predict-text", response_model=TransactionResponse)
def predict_from_text(req: TransactionRequest):
    result = predict_transaction(req.text)
    return TransactionResponse(raw_output=result)