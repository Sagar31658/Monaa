from pydantic import BaseModel

class TransactionRequest(BaseModel):
    text: str

class TransactionResponse(BaseModel):
    raw_output: str