import pandas as pd
from datasets import Dataset
from transformers import T5Tokenizer, T5ForConditionalGeneration, Trainer, TrainingArguments, DataCollatorForSeq2Seq
import torch

# Load your CSV dataset
df = pd.read_csv("./data/monaa_t5_training_data.csv")
dataset = Dataset.from_pandas(df)

# Load tokenizer and model
tokenizer = T5Tokenizer.from_pretrained("t5-small")
model = T5ForConditionalGeneration.from_pretrained("t5-small")

# Preprocessing function
def preprocess(example):
    model_input = tokenizer(example['input_text'], padding="max_length", truncation=True, max_length=128)
    label = tokenizer(example['target_text'], padding="max_length", truncation=True, max_length=64)
    model_input["labels"] = label["input_ids"]
    return model_input

tokenized_dataset = dataset.map(preprocess, batched=False)

# Training args
training_args = TrainingArguments(
    output_dir="./monaa-t5",
    evaluation_strategy="no",
    learning_rate=3e-4,
    per_device_train_batch_size=8,
    num_train_epochs=5,
    weight_decay=0.01,
    save_total_limit=1,
    logging_steps=10,
    logging_dir="./logs",
    fp16=torch.cuda.is_available()
)

# Data collator
data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    tokenizer=tokenizer,
    data_collator=data_collator
)

# Start training
trainer.train()

# Save the fine-tuned model
trainer.save_model("./monaa-t5-final")
tokenizer.save_pretrained("./monaa-t5-final")

print("✅ Training complete. Model saved to ./monaa-t5-final")
