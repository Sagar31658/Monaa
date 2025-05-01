from transformers import T5Tokenizer, T5ForConditionalGeneration
from app.core.config import settings
import torch

tokenizer = T5Tokenizer.from_pretrained(settings.MODEL_PATH)
model = T5ForConditionalGeneration.from_pretrained(settings.MODEL_PATH)
model.eval()

def predict_transaction(text: str) -> str:
    prompt = f"extract transaction: {text}"
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=64)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
