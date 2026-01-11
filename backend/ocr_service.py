import os
import base64
from typing import Dict, Any, Optional
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

QIANFAN_BASE_URL = "https://qianfan.baidubce.com/v2"
QIANFAN_CHAT_URL = f"{QIANFAN_BASE_URL}/chat/completions"
DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions"

QIANFAN_API_KEY = os.getenv(
    "QIANFAN_API_KEY",
    "bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980",
)

DEEPSEEK_API_KEY = os.getenv(
    "DEEPSEEK_API_KEY",
    "sk-683afa31c6c04431b4377d73c2ee6436",
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


class DeepSeekParseRequest(BaseModel):
    ocr_text: str


def call_deepseek_parse(ocr_text: str) -> Dict[str, Any]:
    """呼叫 DeepSeek API 解析 OCR 文字，提取成績事件"""
    prompt = f"""You are an assistant that extracts exam/assignment events from a school schedule.
Return ONLY valid JSON. Do not wrap in markdown. Do not add any commentary.

Schema:
{{
  "events": [
    {{
      "id": "string",
      "date": "YYYY-MM-DD or empty string",
      "date_range": "YYYY-MM-DD..YYYY-MM-DD or empty string",
      "week": "string",
      "subject": "string",
      "type": "string",
      "title": "string",
      "notes": "string"
    }}
  ]
}}

Rules:
- Only include items that should have a score: 大測/測驗/考試/報告/作業/實驗考/選考.
- If one cell contains multiple items split into multiple events.
- If year is missing, leave date empty string.

Schedule text:
{ocr_text}"""

    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
    }

    r = requests.post(DEEPSEEK_ENDPOINT, headers=headers, json=payload, timeout=120)
    if r.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "DeepSeek parse upstream error",
                "status_code": r.status_code,
                "response": r.text[:2000],
            },
        )
    return r.json()


@app.post("/parse-grades")
async def parse_grades(request: DeepSeekParseRequest):
    """解析 OCR 文字，提取成績事件"""
    try:
        result = call_deepseek_parse(request.ocr_text)
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse failed: {e}")
