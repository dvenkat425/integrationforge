export type IntegrationPlan = {
  summary: string;
  services: string[];
  mermaid: string;
  language: "javascript" | "python";
  code: string;
  setupNotes: string;
};
