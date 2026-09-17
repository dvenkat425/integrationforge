"use client";

import { useEffect, useRef, useState } from "react";

let idCounter = 0;

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            background: "#0f172a",
            primaryColor: "#0c4a6e",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#38bdf8",
            lineColor: "#64748b",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          },
        });
        idCounter += 1;
        const { svg } = await mermaid.render(`mermaid-diagram-${idCounter}`, chart);
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Couldn't render this diagram.");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return <div ref={containerRef} className="[&_svg]:mx-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
