from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch

MODEL_PATH = "./monaa-t5-final"

try:
    tokenizer = T5Tokenizer.from_pretrained(MODEL_PATH)
    model = T5ForConditionalGeneration.from_pretrained(MODEL_PATH)
    model.eval()
except Exception as e:
    raise RuntimeError(f"Failed to load T5 model: {e}")

def predict_transaction(text: str) -> str:
    if not text.strip():
        return "Error: input text is empty."
    prompt = f"extract transaction: {text}"
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=64)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)