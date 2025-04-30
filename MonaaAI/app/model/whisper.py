import whisper
import os
from tempfile import NamedTemporaryFile
from fastapi import UploadFile

model = whisper.load_model("base")

def transcribe_audio(file: UploadFile) -> str:
    try:
        with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(file.file.read())
            tmp_path = tmp.name
        result = model.transcribe(tmp_path)
        os.remove(tmp_path)
        return result.get("text", "")
    except Exception as e:
        return f"Error during transcription: {str(e)}"
