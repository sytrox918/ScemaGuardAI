import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { BenchmarkReport } from "@/types/schemaguard";

export async function GET() {
  try {
    // Attempt local project data directory first
    const localPath = path.join(
      process.cwd(),
      "src",
      "data",
      "challenge_32_2x2_report.json"
    );

    let rawData = "";

    if (fs.existsSync(localPath)) {
      rawData = fs.readFileSync(localPath, "utf-8");
    } else {
      // Fallback to ml_artifacts in workspace
      const workspacePath = path.join(
        process.cwd(),
        "..",
        "ml_artifacts",
        "challenge_32_2x2_report.json"
      );
      if (fs.existsSync(workspacePath)) {
        rawData = fs.readFileSync(workspacePath, "utf-8");
      }
    }

    if (!rawData) {
      return NextResponse.json(
        { error: "Benchmark report artefact not found on server." },
        { status: 404 }
      );
    }

    const report: BenchmarkReport = JSON.parse(rawData);

    return NextResponse.json({
      success: true,
      data: report,
      loaded_from_disk: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Failed to load benchmark report:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: `Failed to load benchmark metrics: ${message}` },
      { status: 500 }
    );
  }
}
