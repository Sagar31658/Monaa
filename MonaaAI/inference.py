# inference.py
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch

# Load the fine-tuned model and tokenizer
MODEL_PATH = "./monaa-t5-final"
tokenizer = T5Tokenizer.from_pretrained(MODEL_PATH)
model = T5ForConditionalGeneration.from_pretrained(MODEL_PATH)
model.eval()

def extract_transaction_details(text: str) -> str:
    input_text = f"extract transaction: {text}"
    inputs = tokenizer(input_text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=64)
    decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return decoded

if __name__ == "__main__":
    while True:
        user_input = input("\n🗣️ Enter a transaction command: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        result = extract_transaction_details(user_input)
        print("🔍 Extracted:", result)
