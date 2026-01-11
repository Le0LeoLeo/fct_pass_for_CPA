#!/bin/bash

# 啟動OCR服務
echo "正在啟動OCR服務..."
uvicorn ocr_service:app --reload --port 8000 --host 0.0.0.0
