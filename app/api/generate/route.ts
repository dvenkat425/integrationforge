import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-5";

const generateTool: Anthropic.Tool = {
  name: "generate_integration",
  description: "Return a working integration for the described automation, plus a diagram of its flow.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "One or two sentences describing the trigger and what the automation does",
      },
      services: {
        type: "array",
        items: { type: "string" },
        description: "Short names of the services involved, e.g. ['Stripe', 'Slack', 'PostgreSQL']",
      },
      mermaid: {
        type: "string",
        description:
          "A valid Mermaid flowchart definition (start with 'flowchart TD') showing trigger -> steps -> outputs. Keep node labels short. Use simple node ids like A, B, C.",
      },
      language: { type: "string", enum: ["javascript", "python"] },
      setupNotes: {
        type: "string",
        description:
          "Short markdown-free bullet list (use '- ' prefixes, newline separated) of the real-world setup steps: which API keys to get, which env vars to set, where to register the webhook, etc.",
      },
      code: {
        type: "string",
        description:
          "A complete, runnable webhook handler implementing the flow (Node.js/Express for javascript, Flask for python). Use environment variables for any API keys/URLs (e.g. process.env.SLACK_WEBHOOK_URL), include real HTTP calls to the actual services named using fetch/requests, include error handling, and comment clearly where the user must fill in their own credentials or endpoint details. It should be realistic enough to adapt and deploy, not pseudocode. Keep it focused and under roughly 100 lines — this is a portfolio demo, not a production repo, so favor a clear, complete example over an exhaustive one.",
      },
    },
    required: ["summary", "services", "mermaid", "language", "setupNotes", "code"],
  },
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project settings." },
      { status: 500 }
    );
  }

  const { description } = (await req.json()) as { description: string };
  if (!description) {
    return NextResponse.json({ error: "Missing description" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system:
        "You are IntegrationForge, a tool that turns a plain-English description of an automation into a working webhook/integration handler and a flow diagram. Favor real, idiomatic code for the services involved (Slack incoming webhooks, Stripe webhook signature basics, generic REST calls, etc.) over vague pseudocode, but keep the code focused rather than exhaustive — this is a demo, and running out of output length is worse than a shorter example. Always call generate_integration.",
      tools: [generateTool],
      tool_choice: { type: "tool", name: "generate_integration" },
      messages: [{ role: "user", content: description }],
    });

    if (response.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "The response was too long and got cut off. Try a shorter or simpler description." },
        { status: 500 }
      );
    }

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (!toolUse) {
      return NextResponse.json({ error: "Model did not return a structured result." }, { status: 500 });
    }

    const plan = toolUse.input as Record<string, unknown>;
    const requiredFields = ["summary", "services", "mermaid", "language", "setupNotes", "code"];
    const missing = requiredFields.filter((f) => plan[f] === undefined);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Response was missing: ${missing.join(", ")}. Try again — this can happen occasionally.` },
        { status: 500 }
      );
    }

    return NextResponse.json(plan);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong calling Claude." }, { status: 500 });
  }
}
