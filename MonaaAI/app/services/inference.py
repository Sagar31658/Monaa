from app.model.t5_model import predict_transaction

def extract_transaction_details(text: str) -> dict:
    raw = predict_transaction(text)
    try:
        parts = dict(item.split(": ") for item in raw.split(", "))
        return {
            "amount": float(parts.get("amount", 0)),
            "type": parts.get("type", ""),
            "category": parts.get("category", ""),
            "date": parts.get("date", "")
        }
    except Exception:
        return {"error": "Invalid model output"}
