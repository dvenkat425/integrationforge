"use client";

import { useState } from "react";
import { IntegrationPlan } from "@/lib/types";
import MermaidDiagram from "@/components/MermaidDiagram";

const EXAMPLES = [
  "When a Stripe payment fails, alert #payments in Slack and log the event to a database",
  "When a new row is added to a Google Sheet, create a Notion page and email the team",
  "When a GitHub pull request is opened, run the test suite and post the result to Slack",
];

export default function Home() {
  const [description, setDescription] = useState("");
  const [plan, setPlan] = useState<IntegrationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate(desc: string) {
    if (!desc.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setPlan(data);
    } catch {
      setError("Request failed.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!plan) return;
    navigator.clipboard.writeText(plan.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-14">
      <header className="text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
          IntegrationForge
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Describe it. Get a working integration.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Type an automation in plain English — Claude plans the flow, diagrams it, and writes a
          real webhook handler you can adapt and deploy.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate(description);
        }}
        className="flex flex-col gap-3"
      >
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. When a customer cancels their subscription, notify #churn in Slack and add them to a win-back email list"
          rows={3}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              type="button"
              key={ex}
              onClick={() => {
                setDescription(ex);
                generate(ex);
              }}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-left text-xs text-slate-400 hover:border-violet-400 hover:text-violet-300"
            >
              {ex}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-xl bg-violet-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-violet-400 disabled:opacity-50"
        >
          {loading ? "Building…" : "Generate integration"}
        </button>
      </form>

      {error && (
        <p className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
          ⚠️ {error}
        </p>
      )}

      {plan && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="mb-2 text-sm text-slate-400">{plan.summary}</p>
            <div className="flex flex-wrap gap-2">
              {(plan.services ?? []).map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-violet-800 bg-violet-950/40 px-2.5 py-0.5 text-xs text-violet-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="mb-3 text-sm font-medium text-slate-300">Flow</p>
            <MermaidDiagram chart={plan.mermaid} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-300">
                Generated handler ({plan.language})
              </p>
              <button
                onClick={copyCode}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                {copied ? "Copied!" : "Copy code"}
              </button>
            </div>
            <pre className="rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-300">
              <code>{plan.code ?? ""}</code>
            </pre>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="mb-2 text-sm font-medium text-slate-300">Setup checklist</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
              {(plan.setupNotes ?? "")
                .split("\n")
                .map((line) => line.replace(/^-\s*/, "").trim())
                .filter(Boolean)
                .map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
            </ul>
          </div>
        </div>
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-slate-600">
        Built with Next.js + the Claude API ·{" "}
        <a className="underline hover:text-slate-400" href="https://github.com" target="_blank" rel="noreferrer">
          View source
        </a>
      </footer>
    </main>
  );
}
