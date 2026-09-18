import { NextRequest } from "next/server";
import { sseBus, PipelineEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("assetId");
  const isGlobal = searchParams.get("global") === "true";

  if (!assetId && !isGlobal) {
    return new Response(
      JSON.stringify({
        error: "Missing required query parameter: 'assetId' or 'global=true'",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const handshake = {
        type: "connected",
        channel: isGlobal ? "global" : assetId,
        timestamp: Date.now(),
      };
      controller.enqueue(
        encoder.encode(
          `event: handshake\ndata: ${JSON.stringify(handshake)}\n\n`,
        ),
      );

      const onEvent = (event: PipelineEvent) => {
        try {
          const payload = `event: pipeline\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error("[SSE Stream] Failed to enqueue event:", err);
        }
      };

      const unsubscribe = isGlobal
        ? sseBus.subscribeGlobal(onEvent)
        : sseBus.subscribe(assetId!, onEvent);

      const keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepAliveTimer);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAliveTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
