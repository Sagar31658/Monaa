import whisper
import os
from tempfile import NamedTemporaryFile
from fastapi import UploadFile
from app.core.config import settings

model = whisper.load_model(settings.WHISPER_MODEL)

def transcribe_audio(file: UploadFile) -> str:
    print('i am here')
    print(file)
    try:
        with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(file.file.read())
            tmp_path = tmp.name
        result = model.transcribe(tmp_path)
        print(result)
        os.remove(tmp_path)
        return result.get("text", "")
    except Exception as e:
        return f"Error during transcription: {str(e)}"
