from fastapi import APIRouter, UploadFile, File
from app.models.whisper_stt import transcribe_audio
from app.models.t5_model import predict_transaction
from app.schemas.voice import VoiceResponse

router = APIRouter(tags=["Voice-to-Transaction"])

@router.post("/predict-voice", response_model=VoiceResponse)
def predict_from_voice(audio: UploadFile = File(...)):
    transcript = transcribe_audio(audio)
    if transcript.lower().startswith("error"):
        return VoiceResponse(transcript=transcript, raw_output="")
    result = predict_transaction(transcript)
    return VoiceResponse(transcript=transcript, raw_output=result)