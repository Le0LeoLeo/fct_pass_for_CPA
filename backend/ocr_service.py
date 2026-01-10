import os
import base64
from typing import Dict, Any
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

QIANFAN_BASE_URL = "https://qianfan.baidubce.com/v2"
QIANFAN_CHAT_URL = f"{QIANFAN_BASE_URL}/chat/completions"

QIANFAN_API_KEY = os.getenv(
    "QIANFAN_API_KEY",
    "bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980",
)

MODEL_NAME = "deepseek-ocr"

app = FastAPI(title="DeepSeek OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def image_bytes_to_data_url(image_bytes: bytes, mime: str = "image/png") -> str:
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime};base64,{b64}"


def call_deepseek_ocr(image_png_bytes: bytes) -> Dict[str, Any]:
    """呼叫 Qianfan 的 chat/completions，model=deepseek-ocr"""
    data_url = image_bytes_to_data_url(image_png_bytes, mime="image/png")

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "請對圖片進行OCR，輸出識別到的文字。如果是成績單，請提取科目名稱和分數。"},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "stop": [],
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {QIANFAN_API_KEY}",
    }

    r = requests.post(QIANFAN_CHAT_URL, headers=headers, json=payload, timeout=120)
    if r.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "DeepSeek OCR upstream error",
                "status_code": r.status_code,
                "response": r.text[:2000],
            },
        )
    return r.json()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    """上傳圖片進行OCR識別"""
    filename = file.filename or "upload"
    content_type = file.content_type or ""
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    is_image = content_type.startswith("image/") or any(
        filename.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"]
    )

    if not is_image:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: content_type={content_type}",
        )

    try:
        ocr_json = call_deepseek_ocr(raw)
        return JSONResponse({"filename": filename, "type": "image", "ocr": ocr_json})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OCR failed: {e}")
