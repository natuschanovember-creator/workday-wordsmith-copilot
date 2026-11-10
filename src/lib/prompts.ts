// Structured prompt builders. Each prompt follows the same visible framework so users can
// read, understand and edit exactly what is sent to the AI:
// ROLE → CONTEXT → TASK → REQUIREMENTS → OUTPUT FORMAT.

export type PromptSection = { label: string; body: string };

export function renderPrompt(sections: PromptSection[]): string {
  return sections
    .filter((s) => s.body.trim().length > 0)
    .map((s) => `## ${s.label}\n${s.body.trim()}`)
    .join("\n\n");
}

export const EMAIL_TYPES = [
  "Follow-up",
  "Meeting request",
  "Project update",
  "Introduction",
  "Thank you",
  "Request for help",
  "Apology",
  "Announcement",
  "Feedback",
  "Custom",
] as const;

export const EMAIL_TONES = [
  "Professional",
  "Friendly",
  "Formal",
  "Persuasive",
  "Concise",
  "Empathetic",
] as const;

export const EMAIL_LENGTHS = {
  Short: "Keep it brief: 50–100 words.",
  Medium: "Aim for 100–200 words.",
  Detailed: "Be thorough: 200–350 words.",
} as const;

export const RELATIONSHIPS = [
  "Colleague",
  "Manager",
  "Direct report",
  "Executive",
  "Client",
  "Vendor / partner",
  "Candidate",
  "New contact",
] as const;

export type EmailInputs = {
  emailType: string;
  recipient: string;
  relationship: string;
  tone: string;
  length: keyof typeof EMAIL_LENGTHS;
  keyPoints: string;
  senderName: string;
  senderRole: string;
};

export function buildEmailSections(i: EmailInputs): PromptSection[] {
  const sender = [i.senderName, i.senderRole].filter(Boolean).join(", ");
  return [
    {
      label: "ROLE",
      body: "You are an expert workplace communication assistant.",
    },
    {
      label: "CONTEXT",
      body: [
        `Email type: ${i.emailType}`,
        `Recipient: ${i.recipient || "[recipient name]"}${i.relationship ? ` (${i.relationship.toLowerCase()})` : ""}`,
        sender ? `Sender: ${sender}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      label: "TASK",
      body: `Write a ${i.tone.toLowerCase()} ${i.emailType.toLowerCase()} email that covers these key points:\n${
        i.keyPoints
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => `- ${l.replace(/^[-•*]\s*/, "")}`)
          .join("\n") || "- [describe what the email should say]"
      }`,
    },
    {
      label: "REQUIREMENTS",
      body: [
        `Tone: ${i.tone}.`,
        `Length: ${EMAIL_LENGTHS[i.length]}`,
        "Use a clear subject line, a greeting, short paragraphs and a clear call to action where appropriate.",
        "Use [placeholders] for any details that were not provided. Do not invent facts.",
      ].join("\n"),
    },
    {
      label: "OUTPUT FORMAT",
      body: 'Plain text. First line "Subject: …", then a blank line, then the email body and sign-off.',
    },
  ];
}

export const RESEARCH_DEPTHS = {
  "Quick overview": "A concise overview of roughly 250–400 words.",
  "Standard brief": "A structured brief of roughly 500–800 words.",
  "Deep dive": "An in-depth analysis of roughly 900–1400 words.",
} as const;

export const RESEARCH_AUDIENCES = [
  "Executive leadership",
  "My team",
  "Technical specialists",
  "Clients / stakeholders",
  "General audience",
] as const;

export const RESEARCH_FOCUS = [
  "Key concepts",
  "Current trends",
  "Pros & cons",
  "Risks & challenges",
  "Best practices",
  "Market landscape",
  "Key statistics",
  "Action steps",
] as const;

export const RESEARCH_FORMATS = {
  "Executive brief": "Headings: Summary, Key findings, Analysis, Recommendations, What to verify.",
  "Bullet summary": "Mostly bullet points grouped under short headings, ending with What to verify.",
  "SWOT analysis": "A SWOT table (Strengths, Weaknesses, Opportunities, Threats) plus a short summary and What to verify.",
  "Comparison table": "A markdown comparison table of the main options with a short recommendation and What to verify.",
} as const;

export type ResearchInputs = {
  topic: string;
  question: string;
  audience: string;
  depth: keyof typeof RESEARCH_DEPTHS;
  focus: string[];
  format: keyof typeof RESEARCH_FORMATS;
};

export function buildResearchSections(i: ResearchInputs): PromptSection[] {
  return [
    {
      label: "ROLE",
      body: "You are a rigorous research analyst supporting a busy professional.",
    },
    {
      label: "CONTEXT",
      body: [
        `Topic: ${i.topic || "[research topic]"}`,
        i.question ? `Goal / key question: ${i.question}` : "",
        `Audience: ${i.audience}`,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      label: "TASK",
      body: `Research the topic and produce ${RESEARCH_DEPTHS[i.depth].charAt(0).toLowerCase()}${RESEARCH_DEPTHS[i.depth].slice(1)}${
        i.focus.length ? `\nFocus on: ${i.focus.join(", ")}.` : ""
      }`,
    },
    {
      label: "REQUIREMENTS",
      body: [
        `Write for: ${i.audience.toLowerCase()}. Keep language clear and jargon-light unless the audience is technical.`,
        "Separate established facts from opinions or estimates.",
        "Do not fabricate sources, links or statistics; flag uncertain or possibly outdated information.",
      ].join("\n"),
    },
    {
      label: "OUTPUT FORMAT",
      body: `Markdown. ${RESEARCH_FORMATS[i.format]}`,
    },
  ];
}

/** Derive a short, readable title for a saved document. */
export function deriveTitle(kind: "email" | "research", content: string, fallback: string): string {
  if (kind === "email") {
    const subject = content.match(/^\s*subject:\s*(.+)$/im)?.[1]?.trim();
    if (subject) return subject.slice(0, 120);
  } else {
    const heading = content.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim();
    if (heading) return heading.replace(/[*_`]/g, "").slice(0, 120);
  }
  return (fallback.trim() || "Untitled").slice(0, 120);
}
