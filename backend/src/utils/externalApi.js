import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export const getTransactionFromAudio = async (filePath) => {
  try {
    const form = new FormData();
    form.append("audio", fs.createReadStream(filePath));

    const { data } = await axios.post(`${process.env.FASTAPI_URL}/api/predict-voice`, form, {
      headers: form.getHeaders()
    });

    return [data.raw_output,data.transcript];
  } catch (error) {
    console.error("❌ FastAPI error:", error.response?.data || error.message);
    return null;
  }
};
