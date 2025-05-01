from fastapi import APIRouter, UploadFile, File
from app.model.whisper_stt import transcribe_audio
from app.services.inference import extract_transaction_details
from app.schemas.voice import VoiceResponse

router = APIRouter(tags=["Voice-to-Transaction"])

@router.post("/predict-voice", response_model=VoiceResponse)
def predict_from_voice(audio: UploadFile = File(...)):
    transcript = transcribe_audio(audio)
    if transcript.lower().startswith("error"):
        return VoiceResponse(transcript=transcript, raw_output="")
    parsed = extract_transaction_details(transcript)
    return VoiceResponse(transcript=transcript, raw_output=str(parsed))
