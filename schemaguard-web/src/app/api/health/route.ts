import { NextResponse } from "next/server";
import {
  getBaseModelId,
  getSglangApiToken,
  getSglangBaseUrl,
  getTunedModelId,
} from "@/lib/sglang-client";
import { HealthResponse } from "@/types/schemaguard";

export async function GET() {
  const baseUrl = getSglangBaseUrl();
  const token = getSglangApiToken();
  const baseModelId = getBaseModelId();
  const tunedModelId = getTunedModelId();

  const timestamp = new Date().toISOString();

  // If no URL configured at all
  if (!baseUrl) {
    const res: HealthResponse = {
      status: "unavailable",
      proxy_url: "",
      proxy_reachable: false,
      sglang_reachable: false,
      base_model: {
        id: baseModelId,
        available: false,
      },
      tuned_model: {
        id: tunedModelId,
        available: false,
        adapter_name: "schemaguard",
      },
      latency_ms: 0,
      environment: {
        base_url_set: false,
        token_set: Boolean(token),
        node_env: process.env.NODE_ENV || "development",
      },
      diagnostics:
        "SGLANG_BASE_URL is not set. The application is operating in local/offline demonstrator mode with calibrated benchmarks and sample extractions.",
      timestamp,
    };
    return NextResponse.json(res);
  }

  const startTime = performance.now();
  let proxyReachable = false;
  let sglangReachable = false;
  let baseAvailable = false;
  let tunedAvailable = false;
  let diagnostics = "";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const healthResp = await fetch(`${baseUrl}/health`, {
      headers: {
        "X-SchemaGuard-Token": token,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (healthResp.ok) {
      proxyReachable = true;
      const data = await healthResp.json();
      const isOnline = data.status === "ok" || Boolean(data.sglang_online);
      sglangReachable = isOnline;
      baseAvailable = Boolean(data.base_model_available ?? isOnline);
      tunedAvailable = Boolean(data.tuned_adapter_available ?? isOnline);
      diagnostics = sglangReachable
        ? `Connected to live SGLang proxy (${baseUrl}). Ready for live inference.`
        : `Proxy reached but upstream SGLang is offline.`;
    } else {
      proxyReachable = true;
      diagnostics = `Proxy reached but returned HTTP ${healthResp.status}: ${await healthResp.text().catch(() => "")}`;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    diagnostics = `Cannot reach Kaggle proxy at ${baseUrl} (${errorMsg}). Verify that the Cloudflare tunnel and proxy script are running in Kaggle.`;
  }

  const latencyMs = Math.round(performance.now() - startTime);

  let overallStatus: "healthy" | "degraded" | "unavailable" = "unavailable";
  if (proxyReachable && sglangReachable && baseAvailable && tunedAvailable) {
    overallStatus = "healthy";
  } else if (proxyReachable && sglangReachable) {
    overallStatus = "degraded";
  }

  const res: HealthResponse = {
    status: overallStatus,
    proxy_url: baseUrl.replace(/^(https?:\/\/[^/]+).*/, "$1"),
    proxy_reachable: proxyReachable,
    sglang_reachable: sglangReachable,
    base_model: {
      id: baseModelId,
      available: baseAvailable,
    },
    tuned_model: {
      id: tunedModelId,
      available: tunedAvailable,
      adapter_name: "schemaguard",
    },
    latency_ms: latencyMs,
    environment: {
      base_url_set: true,
      token_set: Boolean(token),
      node_env: process.env.NODE_ENV || "development",
    },
    diagnostics,
    timestamp,
  };

  return NextResponse.json(res);
}
