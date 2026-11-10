import { describe, expect, it } from "vitest";

import { buildEmailSections, buildResearchSections, deriveTitle, renderPrompt } from "@/lib/prompts";

describe("structured prompts", () => {
  it("email prompt follows the ROLE → CONTEXT → TASK → REQUIREMENTS → OUTPUT FORMAT framework", () => {
    const sections = buildEmailSections({
      emailType: "Follow-up",
      recipient: "Dana",
      relationship: "Client",
      tone: "Friendly",
      length: "Short",
      keyPoints: "Thanks for the call\n- Send proposal Friday",
      senderName: "Sam",
      senderRole: "",
    });
    expect(sections.map((s) => s.label)).toEqual([
      "ROLE",
      "CONTEXT",
      "TASK",
      "REQUIREMENTS",
      "OUTPUT FORMAT",
    ]);
    const prompt = renderPrompt(sections);
    expect(prompt).toContain("- Send proposal Friday");
    expect(prompt).toContain("Recipient: Dana (client)");
  });

  it("research prompt forbids fabricated sources", () => {
    const prompt = renderPrompt(
      buildResearchSections({
        topic: "Remote work",
        question: "",
        audience: "My team",
        depth: "Quick overview",
        focus: ["Best practices"],
        format: "Bullet summary",
      }),
    );
    expect(prompt).toContain("Do not fabricate sources");
    expect(prompt).toContain("Focus on: Best practices.");
  });

  it("titles come from the email subject or research heading", () => {
    expect(deriveTitle("email", "Subject: Q3 kickoff\n\nHi team", "x")).toBe("Q3 kickoff");
    expect(deriveTitle("research", "# AI in HR\nBody", "x")).toBe("AI in HR");
    expect(deriveTitle("email", "no subject", "Fallback")).toBe("Fallback");
  });
});
