"""SchemaGuard Kaggle FastAPI Proxy.

Topology:
  Next.js Server (Vercel)
         |  (Authenticated HTTPS via Cloudflare Quick Tunnel)
         v
  FastAPI Proxy (127.0.0.1:30001)
         |  (Local SGLang HTTP)
         v
  SGLang Inference Server (127.0.0.1:30000)
         |-- Qwen/Qwen3-1.7B (Base)
         +-- Qwen/Qwen3-1.7B + schemaguard (LoRA)

Usage in Kaggle notebook:
  export SCHEMAGUARD_PROXY_TOKEN="your-secure-secret-token"
  python schemaguard_proxy.py

In another cell / terminal:
  cloudflared tunnel --url http://127.0.0.1:30001
"""

import os
import sys
import time
import httpx
import uvicorn
from fastapi import FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="SchemaGuard Kaggle Proxy", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SGLANG_URL = os.environ.get("SGLANG_LOCAL_URL", "http://127.0.0.1:30000")
PROXY_SECRET = os.environ.get("SCHEMAGUARD_PROXY_TOKEN", "schemaguard-hackathon-2026")
BASE_MODEL_ID = os.environ.get("BASE_MODEL_ID", "Qwen/Qwen3-1.7B")
TUNED_MODEL_ID = os.environ.get("TUNED_MODEL_ID", "Qwen/Qwen3-1.7B:schemaguard")

WHITELISTED_MODELS = {
    BASE_MODEL_ID,
    TUNED_MODEL_ID,
    "schemaguard",
    "Qwen/Qwen3-1.7B",
}


def verify_token(x_schemaguard_token: str = Header(None)):
    """Enforce token authentication on proxy requests."""
    if not x_schemaguard_token or x_schemaguard_token != PROXY_SECRET:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Missing or invalid X-SchemaGuard-Token header.",
        )


@app.get("/health")
async def health(x_schemaguard_token: str = Header(None)):
    """Health endpoint reporting SGLang connectivity and loaded models."""
    verify_token(x_schemaguard_token)

    start = time.perf_counter()
    sglang_online = False
    models_available = []
    error_msg = None

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{SGLANG_URL}/v1/models")
            if r.status_code == 200:
                sglang_online = True
                data = r.json()
                models_available = [m.get("id") for m in data.get("data", [])]
            else:
                error_msg = f"SGLang returned HTTP {r.status_code}"
        except Exception as e:
            error_msg = f"Failed to connect to SGLang at {SGLANG_URL}: {str(e)}"

    latency_ms = round((time.perf_counter() - start) * 1000, 2)

    has_base = any(BASE_MODEL_ID in m or "Qwen3-1.7B" in m for m in models_available)
    has_tuned = any(
        "schemaguard" in m or TUNED_MODEL_ID in m for m in models_available
    )

    return {
        "status": "healthy" if (sglang_online and has_base) else "degraded" if sglang_online else "unavailable",
        "sglang_online": sglang_online,
        "sglang_url": SGLANG_URL,
        "models_detected": models_available,
        "base_model_available": has_base,
        "tuned_adapter_available": has_tuned,
        "latency_ms": latency_ms,
        "error": error_msg,
    }


@app.get("/v1/models")
async def list_models(x_schemaguard_token: str = Header(None)):
    verify_token(x_schemaguard_token)
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{SGLANG_URL}/v1/models")
            return JSONResponse(status_code=r.status_code, content=r.json())
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"SGLang unreachable: {str(e)}")


@app.post("/v1/chat/completions")
async def chat_completions(request: Request, x_schemaguard_token: str = Header(None)):
    verify_token(x_schemaguard_token)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    model_requested = body.get("model")
    if model_requested not in WHITELISTED_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Model '{model_requested}' is not permitted. Permitted: {list(WHITELISTED_MODELS)}",
        )

    # Forward to SGLang
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            res = await client.post(
                f"{SGLANG_URL}/v1/chat/completions",
                json=body,
                headers={"Content-Type": "application/json"},
            )
            return Response(
                content=res.content,
                status_code=res.status_code,
                media_type="application/json",
            )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="SGLang upstream inference timed out")
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"SGLang upstream connection failed: {str(e)}",
            )


if __name__ == "__main__":
    port = int(os.environ.get("PROXY_PORT", 30001))
    print(f"Starting SchemaGuard Kaggle Proxy on port {port} -> {SGLANG_URL}")
    print(f"Expected Auth Header: X-SchemaGuard-Token")
    uvicorn.run(app, host="0.0.0.0", port=port)
