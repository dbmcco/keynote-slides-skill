// ABOUTME: Shared brand profiles for keynote decks in this repo.
// ABOUTME: Loaded by deck HTML to keep entity styling consistent.
window.KEYNOTE_BRANDS = {
  lightforgeworks: {
    label: "LightForge Works",
    tokens: {
      "brand-ink": "#1a1a1a",
      "brand-ink-soft": "#333333",
      "brand-paper": "#f5f1e8",
      "brand-paper-deep": "#e8dcc6",
      "brand-accent": "#b8956f",
      "brand-accent-strong": "#9a7a57",
      "brand-sage": "#d4a574",
      "brand-slate": "#666666",
      "brand-line": "rgba(26, 26, 26, 0.12)",
      "brand-glow": "rgba(184, 149, 111, 0.35)",
    },
    fonts: {
      display: "\"Helvetica Neue\", \"Segoe UI\", \"Helvetica\", sans-serif",
      body: "\"Helvetica Neue\", \"Segoe UI\", \"Helvetica\", sans-serif",
    },
    fontLabel: "Display: System sans. Body: System sans.",
    mediaPromptPrefix: "warm parchment palette, refined brass accents, minimal editorial lighting",
    defaultDeckType: "pitch",
    deckPreferences: {
      pitch: {
        voice: "confident, concise, design-led",
        headlineStyle: "short, verb-led, outcome first",
        narrative: ["Context", "Problem", "Solution", "Proof", "Ask"],
        density: "low",
        visualFocus: "hero visual + single insight per slide",
        avoid: ["dense paragraphs", "multi-idea slides"],
      },
    },
  },
  synthyra: {
    label: "Synthyra",
    tokens: {
      "brand-ink": "#1a1a2e",
      "brand-ink-soft": "#2d2d44",
      "brand-paper": "#fafbfc",
      "brand-paper-deep": "#f0f2f5",
      "brand-accent": "#ed8936",
      "brand-accent-strong": "#dd6b20",
      "brand-sage": "#00b5d8",
      "brand-slate": "#4a5568",
      "brand-line": "rgba(26, 26, 46, 0.12)",
      "brand-glow": "rgba(237, 137, 54, 0.35)",
    },
    fonts: {
      display: "\"Inter\", \"Helvetica Neue\", sans-serif",
      body: "\"Inter\", \"Helvetica Neue\", sans-serif",
    },
    fontLabel: "Display: Inter. Body: Inter.",
    mediaPromptPrefix: "modern biotech palette, amber and cyan highlights, clean studio lighting",
    defaultDeckType: "strategy",
    deckPreferences: {
      strategy: {
        voice: "direct, actionable, evidence-focused",
        headlineStyle: "clear verdicts with concrete next steps",
        narrative: ["Verdict", "Positioning", "GTM", "Proof Points", "Actions"],
        density: "medium",
        visualFocus: "tables, timelines, action lists",
        avoid: ["vague strategy-speak", "unactionable recommendations"],
      },
    },
  },
  navicyte: {
    label: "Navicyte Biotech",
    tokens: {
      "brand-ink": "#0e2841",
      "brand-ink-soft": "#1a3a57",
      "brand-paper": "#f6f7f9",
      "brand-paper-deep": "#e8e8e8",
      "brand-accent": "#156082",
      "brand-accent-strong": "#0f9ed5",
      "brand-sage": "#196b24",
      "brand-slate": "#0e2841",
      "brand-line": "rgba(14, 40, 65, 0.12)",
      "brand-glow": "rgba(21, 96, 130, 0.32)",
    },
    fonts: {
      display: "\"Avenir Next\", \"Helvetica Neue\", sans-serif",
      body: "\"Avenir Next\", \"Helvetica Neue\", sans-serif",
    },
    fontLabel: "Display: Avenir Next. Body: Avenir Next.",
    mediaPromptPrefix: "navy biotech palette, teal accents, high-clarity lab lighting",
    defaultDeckType: "partner",
    deckPreferences: {
      partner: {
        voice: "strategic, collaborative, opportunity-focused",
        headlineStyle: "mutual value and pathway clarity",
        narrative: ["Opportunity", "Mechanism", "Validation", "Pathway", "Next steps"],
        density: "medium-low",
        visualFocus: "process maps, clinical milestones",
        avoid: ["overly technical walls of text"],
      },
    },
  },
};

window.KEYNOTE_DEFAULT_ENTITY = "lightforgeworks";
