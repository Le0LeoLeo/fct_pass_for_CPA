# 後端服務

## OCR 服務

### 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

### 配置環境變數

創建 `.env` 文件：

```
QIANFAN_API_KEY=bce-v3/your-api-key-here
```

### 啟動服務

```bash
uvicorn ocr_service:app --reload --port 8000
```

服務將在 `http://localhost:8000` 運行。

### API 端點

- `GET /health` - 健康檢查
- `POST /ocr` - 上傳圖片進行OCR識別

## 使用說明

1. 確保已安裝 Python 3.8+
2. 安裝依賴：`pip install -r requirements.txt`
3. 配置 `.env` 文件
4. 啟動服務：`uvicorn ocr_service:app --reload`
