from pydantic import BaseModel

class VoiceResponse(BaseModel):
    transcript: str
    raw_output: str