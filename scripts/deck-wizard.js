#!/usr/bin/env node
/**
 * Guided Deck Creation Wizard
 *
 * Enforces quality from the start by walking through:
 * 1. Deck parameters (ONE thing, audience, action, delivery)
 * 2. Slide-by-slide creation with visual concepts
 * 3. Quality gates (no empty visuals, statement headlines, duration fit)
 *
 * Usage:
 *   node scripts/deck-wizard.js <deck-id> [--entity ENTITY]
 *
 * Outputs:
 *   - decks/<deck-id>/slides.md (outline with headlines and visual concepts)
 *   - decks/<deck-id>/index.html (skeleton with proper structure)
 *   - decks/<deck-id>/resources/materials/image-prompts.md (prompts for generation)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================================
// DESIGN PHILOSOPHY
// ============================================================================

const PHILOSOPHY = {
  core: 'Image > text. One idea per slide. Headlines make claims, not labels.',
  rules: {
    imageFirst: 'Every slide needs a visual concept. If you cannot picture it, rethink it.',
    oneIdea: 'One slide = one point. If you have two ideas, make two slides.',
    headlines: 'Headlines are statements, not labels. "Revenue grew 3x" not "Revenue".',
    duration: 'Rule of thumb: 1-2 minutes per slide. 10 slides = ~15 minute talk.',
    whitespace: 'When in doubt, remove. Let whitespace do the talking.',
  },
};

// ============================================================================
// INTERVIEW QUESTIONS - DECK PARAMETERS
// ============================================================================

const DECK_QUESTIONS = [
  {
    id: 'oneThink',
    question: "What's the ONE thing the audience should remember?",
    help: 'Not three things. Not a list. The single most important takeaway.',
    examples: '"This product will save you 40% on cloud costs" or "We should invest in Asia expansion"',
    required: true,
  },
  {
    id: 'audience',
    question: 'Who is the audience? What do they care about?',
    help: 'Be specific. "Investors" is too vague. "Series A investors who care about TAM" is better.',
    examples: '"CFO who cares about cost reduction" or "Technical leads evaluating build vs buy"',
    required: true,
  },
  {
    id: 'action',
    question: 'What action should they take after?',
    help: 'Every deck should drive action. What do you want them to DO?',
    examples: '"Approve the $2M budget" or "Schedule a pilot" or "Align on the strategy"',
    required: true,
  },
  {
    id: 'delivery',
    question: 'How will this be delivered? How long?',
    help: 'Live keynote vs async email changes everything. Duration affects slide count.',
    examples: '"15-minute live presentation" or "Self-paced reading, ~10 minutes"',
    required: true,
  },
  {
    id: 'constraints',
    question: 'Any constraints or things to avoid?',
    help: 'Legal restrictions, sensitive topics, competing narratives to counter.',
    examples: '"Cannot mention acquisition talks" or "Audience is skeptical of AI hype"',
    required: false,
  },
];

// ============================================================================
// SLIDE CREATION FLOW
// ============================================================================

const SLIDE_QUESTIONS = [
  {
    id: 'point',
    question: "What's the SINGLE point of this slide?",
    help: 'State it as a claim, not a topic. "Our costs are 40% lower" not "Cost comparison".',
    required: true,
  },
  {
    id: 'visual',
    question: 'How will you SHOW this? (describe the visual)',
    help: 'What image, chart, or diagram makes this point instantly clear?',
    examples: '"Bar chart showing our price vs competitors" or "Photo of happy customer using product"',
    required: true,
  },
  {
    id: 'headline',
    question: 'Write the headline (a claim, not a label):',
    help: 'Headlines should be complete sentences that make your point.',
    required: true,
  },
];

// ============================================================================
// QUALITY GATES
// ============================================================================

const QUALITY_CHECKS = {
  isLabel: (headline) => {
    const labelPatterns = [
      /^(the\s+)?[a-z]+$/i, // Single word like "Overview" or "The Problem"
      /^(our\s+)?(team|product|solution|approach|mission|vision|values)$/i,
      /^(about|overview|introduction|agenda|summary|conclusion)$/i,
      /^[a-z]+\s+(overview|update|summary)$/i, // "Product Overview"
    ];
    return labelPatterns.some((p) => p.test(headline.trim()));
  },

  isVagueVisual: (visual) => {
    const vaguePatterns = [
      /^(image|photo|picture|graphic|visual|diagram)$/i,
      /^(something|anything|whatever).*$/i,
      /^(tbd|todo|placeholder)$/i,
      /^\s*$/,
    ];
    return vaguePatterns.some((p) => p.test(visual.trim()));
  },

  checkSlideCount: (slideCount, duration) => {
    // Extract minutes from duration string
    const minutes = parseInt(duration.match(/(\d+)/)?.[1] || '15', 10);
    const maxSlides = Math.ceil(minutes / 1.5); // 1.5 min average per slide
    const minSlides = Math.floor(minutes / 2.5); // 2.5 min max per slide

    if (slideCount > maxSlides) {
      return {
        warning: true,
        message: `${slideCount} slides for ${minutes} minutes is likely too many. Aim for ${minSlides}-${maxSlides} slides.`,
      };
    }
    if (slideCount < minSlides && slideCount > 0) {
      return {
        warning: true,
        message: `${slideCount} slides for ${minutes} minutes may feel rushed. Consider ${minSlides}-${maxSlides} slides.`,
      };
    }
    return { warning: false };
  },
};

// ============================================================================
// SLIDE TEMPLATES
// ============================================================================

const SLIDE_LAYOUTS = {
  title: {
    name: 'Title',
    description: 'Opening slide with hero headline',
    layouts: ['layout-title'],
    useFor: 'Opening, section breaks, big claims',
  },
  split: {
    name: 'Split',
    description: 'Text on left, visual on right',
    layouts: ['layout-split'],
    useFor: 'Most content slides, explanations with visuals',
  },
  metrics: {
    name: 'Metrics',
    description: 'Three big numbers',
    layouts: ['layout-metrics'],
    useFor: 'Key stats, proof points, impact numbers',
  },
  quote: {
    name: 'Quote',
    description: 'Centered quote for emphasis',
    layouts: ['layout-quote'],
    useFor: 'Customer testimonials, powerful statements, transitions',
  },
  grid: {
    name: 'Grid',
    description: 'Three or more cards',
    layouts: ['layout-grid'],
    useFor: 'Feature lists, team, options comparison',
  },
};

// ============================================================================
// READLINE HELPERS
// ============================================================================

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function ask(rl, question, options = {}) {
  const { help, examples, required = true, defaultValue } = options;

  return new Promise((resolve) => {
    console.log(`\n${question}`);
    if (help) console.log(`   ${help}`);
    if (examples) console.log(`   e.g., ${examples}`);
    if (defaultValue) console.log(`   [Default: ${defaultValue}]`);

    const prompt = required ? '(required) -> ' : '(optional, Enter to skip) -> ';

    const askAgain = () => {
      rl.question(prompt, (answer) => {
        const trimmed = answer.trim();
        if (required && !trimmed && !defaultValue) {
          console.log('   This field is required. Please provide an answer.');
          askAgain();
        } else {
          resolve(trimmed || defaultValue || '');
        }
      });
    };

    askAgain();
  });
}

async function confirm(rl, question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) -> `, (answer) => {
      resolve(answer.trim().toLowerCase().startsWith('y'));
    });
  });
}

async function selectLayout(rl) {
  console.log('\n   Available layouts:');
  const layouts = Object.entries(SLIDE_LAYOUTS);
  layouts.forEach(([key, layout], i) => {
    console.log(`   ${i + 1}. ${layout.name}: ${layout.description}`);
    console.log(`      Best for: ${layout.useFor}`);
  });

  return new Promise((resolve) => {
    rl.question('\nSelect layout (1-5, or Enter for "split") -> ', (answer) => {
      const num = parseInt(answer.trim(), 10);
      if (num >= 1 && num <= layouts.length) {
        resolve(layouts[num - 1][0]);
      } else {
        resolve('split');
      }
    });
  });
}

// ============================================================================
// OUTPUT GENERATORS
// ============================================================================

function generateSlidesMarkdown(context, slides) {
  const lines = [
    '# ' + (context.title || context.deckId),
    '',
    '## Deck Parameters',
    '',
    `**ONE thing:** ${context.oneThink}`,
    '',
    `**Audience:** ${context.audience}`,
    '',
    `**Action:** ${context.action}`,
    '',
    `**Delivery:** ${context.delivery}`,
    '',
    context.constraints ? `**Constraints:** ${context.constraints}\n` : '',
    '---',
    '',
    '## Slide Outline',
    '',
  ];

  slides.forEach((slide, i) => {
    lines.push(`### Slide ${i + 1}: ${slide.headline}`);
    lines.push('');
    lines.push(`**Point:** ${slide.point}`);
    lines.push('');
    lines.push(`**Visual:** ${slide.visual}`);
    lines.push('');
    lines.push(`**Layout:** ${slide.layout}`);
    lines.push('');
    if (slide.notes) {
      lines.push(`**Notes:** ${slide.notes}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

function generateImagePrompts(context, slides, entityProfile) {
  const prefix = entityProfile?.mediaPromptPrefix || '';
  const lines = [
    '# Image Generation Prompts',
    '',
    `Deck: ${context.title || context.deckId}`,
    `Entity: ${context.entity}`,
    prefix ? `Brand prefix: ${prefix}` : '',
    '',
    '---',
    '',
  ];

  slides.forEach((slide, i) => {
    if (slide.visual && !QUALITY_CHECKS.isVagueVisual(slide.visual)) {
      const fullPrompt = prefix ? `${prefix}, ${slide.visual}` : slide.visual;
      lines.push(`## Slide ${i + 1}: ${slide.headline}`);
      lines.push('');
      lines.push('```');
      lines.push(fullPrompt);
      lines.push('```');
      lines.push('');
    }
  });

  return lines.join('\n');
}

function generateSlideHtml(slide, index, theme = 'theme-ivory') {
  const layoutClass = SLIDE_LAYOUTS[slide.layout]?.layouts[0] || 'layout-split';
  const isActive = index === 0 ? ' is-active' : '';
  const notesMarkup = slide.notes
    ? `\n          <aside class="slide-notes" aria-hidden="true">${escapeHtml(slide.notes)}</aside>`
    : '';

  if (slide.layout === 'title') {
    return `
      <section class="slide ${theme}${isActive}" data-title="${escapeHtml(slide.headline)}">
        <div class="slide-inner ${layoutClass}">
          <div class="eyebrow reveal" style="--reveal-index: 1"><!-- Eyebrow --></div>
          <h1 class="title reveal" style="--reveal-index: 2">${escapeHtml(slide.headline)}</h1>
          <p class="subtitle reveal" style="--reveal-index: 3">${escapeHtml(slide.point)}</p>
          ${notesMarkup}
        </div>
      </section>`;
  }

  if (slide.layout === 'metrics') {
    return `
      <section class="slide ${theme}${isActive}" data-title="${escapeHtml(slide.headline)}">
        <div class="slide-inner ${layoutClass}">
          <div class="metric reveal" style="--reveal-index: 1">
            <div class="metric-number">XX%</div>
            <div class="metric-label">Metric 1</div>
          </div>
          <div class="metric reveal" style="--reveal-index: 2">
            <div class="metric-number">X.Xx</div>
            <div class="metric-label">Metric 2</div>
          </div>
          <div class="metric reveal" style="--reveal-index: 3">
            <div class="metric-number">XX</div>
            <div class="metric-label">Metric 3</div>
          </div>
          ${notesMarkup}
        </div>
      </section>`;
  }

  if (slide.layout === 'quote') {
    return `
      <section class="slide theme-ink${isActive}" data-title="${escapeHtml(slide.headline)}">
        <div class="slide-inner ${layoutClass}">
          <p class="quote reveal" style="--reveal-index: 1">"${escapeHtml(slide.point)}"</p>
          <div class="quote-meta reveal" style="--reveal-index: 2">- Source</div>
          ${notesMarkup}
        </div>
      </section>`;
  }

  // Default: split layout
  return `
      <section class="slide ${theme}${isActive}" data-title="${escapeHtml(slide.headline)}">
        <div class="slide-inner ${layoutClass}">
          <div>
            <h2 class="section-title reveal" style="--reveal-index: 1">${escapeHtml(slide.headline)}</h2>
            <p class="body-text reveal" style="--reveal-index: 2">${escapeHtml(slide.point)}</p>
          </div>
          <div class="media-frame reveal" style="--reveal-index: 2">
            <div class="media-placeholder">${escapeHtml(slide.visual)}</div>
            <img
              class="gen-media"
              data-gen="text-to-image"
              data-prompt="${escapeHtml(slide.visual)}"
              alt="${escapeHtml(slide.headline)}"
            />
          </div>
          ${notesMarkup}
        </div>
      </section>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateIndexHtml(context, slides, templatePath) {
  // Read template
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Find the slides section and replace
  const slidesHtml = slides.map((slide, i) => generateSlideHtml(slide, i)).join('\n');

  // Replace existing slides in template (everything between <main> and </main>)
  const mainRegex = /(<main[^>]*>)[\s\S]*?(<\/main>)/;
  const replacement = `$1\n${slidesHtml}\n    $2`;

  return template.replace(mainRegex, replacement);
}

// ============================================================================
// MAIN WIZARD FLOW
// ============================================================================

async function runDeckParametersInterview(rl) {
  console.log('\n' + '='.repeat(60));
  console.log('DECK PARAMETERS');
  console.log('='.repeat(60));
  console.log('\nBefore we create slides, let\'s establish the foundation.');
  console.log('Remember: ' + PHILOSOPHY.core);

  const context = {};

  for (const q of DECK_QUESTIONS) {
    context[q.id] = await ask(rl, q.question, {
      help: q.help,
      examples: q.examples,
      required: q.required,
    });
  }

  return context;
}

async function runSlideCreation(rl, context) {
  console.log('\n' + '='.repeat(60));
  console.log('SLIDE-BY-SLIDE CREATION');
  console.log('='.repeat(60));
  console.log('\nNow let\'s build your slides one at a time.');
  console.log('Remember: ' + PHILOSOPHY.rules.oneIdea);

  const slides = [];
  let addMore = true;

  while (addMore) {
    console.log(`\n--- SLIDE ${slides.length + 1} ---`);

    const slide = {};

    // Get the point
    slide.point = await ask(rl, SLIDE_QUESTIONS[0].question, {
      help: SLIDE_QUESTIONS[0].help,
      required: true,
    });

    // Get the visual concept
    let visualValid = false;
    while (!visualValid) {
      slide.visual = await ask(rl, SLIDE_QUESTIONS[1].question, {
        help: SLIDE_QUESTIONS[1].help,
        examples: SLIDE_QUESTIONS[1].examples,
        required: true,
      });

      if (QUALITY_CHECKS.isVagueVisual(slide.visual)) {
        console.log('\n   [QUALITY GATE] That visual concept is too vague.');
        console.log('   Be specific: What would we SEE? A chart? A photo? A diagram?');
        console.log('   ' + PHILOSOPHY.rules.imageFirst);
      } else {
        visualValid = true;
      }
    }

    // Get the headline
    let headlineValid = false;
    while (!headlineValid) {
      slide.headline = await ask(rl, SLIDE_QUESTIONS[2].question, {
        help: SLIDE_QUESTIONS[2].help,
        required: true,
      });

      if (QUALITY_CHECKS.isLabel(slide.headline)) {
        console.log('\n   [QUALITY GATE] That looks like a label, not a claim.');
        console.log('   Headlines should be complete sentences that make your point.');
        console.log('   Instead of "Revenue" try "Revenue grew 3x in Q4"');
        const proceed = await confirm(rl, '   Keep this headline anyway?');
        if (proceed) headlineValid = true;
      } else {
        headlineValid = true;
      }
    }

    // Select layout
    slide.layout = await selectLayout(rl);

    // Optional notes
    slide.notes = await ask(rl, 'Any speaker notes for this slide?', {
      required: false,
    });

    slides.push(slide);

    // Check slide count vs duration
    const durationCheck = QUALITY_CHECKS.checkSlideCount(slides.length, context.delivery);
    if (durationCheck.warning) {
      console.log(`\n   [DURATION CHECK] ${durationCheck.message}`);
    }

    addMore = await confirm(rl, '\nAdd another slide?');
  }

  return slides;
}

async function main() {
  const args = process.argv.slice(2);
  const deckId = args.find((a) => !a.startsWith('--'));
  const entityArg = args.find((a) => a.startsWith('--entity='));
  const entity = entityArg ? entityArg.split('=')[1] : 'northwind';

  if (!deckId) {
    console.log('Usage: node scripts/deck-wizard.js <deck-id> [--entity=ENTITY]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/deck-wizard.js my-pitch');
    console.log('  node scripts/deck-wizard.js my-pitch --entity=coastal');
    process.exit(1);
  }

  const scriptDir = path.dirname(__filename);
  const repoRoot = path.resolve(scriptDir, '..');
  const deckDir = path.join(repoRoot, 'decks', deckId);
  const templatePath = path.join(repoRoot, 'skills', 'keynote-slides', 'assets', 'keynote-slides.html');
  const brandsPath = path.join(repoRoot, 'decks', 'brands.js');

  // Load brand profiles
  let brandProfiles = {};
  if (fs.existsSync(brandsPath)) {
    const brandsContent = fs.readFileSync(brandsPath, 'utf-8');
    // Extract the object from window.KEYNOTE_BRANDS = {...}
    const match = brandsContent.match(/window\.KEYNOTE_BRANDS\s*=\s*(\{[\s\S]*?\});/);
    if (match) {
      try {
        // Use Function constructor to evaluate the object literal
        brandProfiles = new Function('return ' + match[1])();
      } catch (e) {
        console.warn('Could not parse brands.js, using defaults');
      }
    }
  }

  const entityProfile = brandProfiles[entity] || {};

  console.log('\n' + '='.repeat(60));
  console.log('DECK CREATION WIZARD');
  console.log('='.repeat(60));
  console.log('\nThis wizard will guide you through creating a quality deck.');
  console.log('');
  console.log('Philosophy:');
  console.log('  - ' + PHILOSOPHY.core);
  Object.entries(PHILOSOPHY.rules).forEach(([, rule]) => {
    console.log('  - ' + rule);
  });
  console.log('');
  console.log(`Deck ID: ${deckId}`);
  console.log(`Entity: ${entity} (${entityProfile.label || 'custom'})`);

  const rl = createInterface();

  try {
    // Phase 1: Deck parameters
    const context = await runDeckParametersInterview(rl);
    context.deckId = deckId;
    context.entity = entity;
    context.title = deckId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    // Phase 2: Slide-by-slide creation
    const slides = await runSlideCreation(rl, context);

    if (slides.length === 0) {
      console.log('\nNo slides created. Exiting.');
      rl.close();
      return;
    }

    // Final duration check
    const finalCheck = QUALITY_CHECKS.checkSlideCount(slides.length, context.delivery);
    if (finalCheck.warning) {
      console.log(`\n[FINAL CHECK] ${finalCheck.message}`);
      const proceed = await confirm(rl, 'Continue anyway?');
      if (!proceed) {
        console.log('Exiting. Re-run to try again.');
        rl.close();
        return;
      }
    }

    // Generate outputs
    console.log('\n' + '='.repeat(60));
    console.log('GENERATING OUTPUT FILES');
    console.log('='.repeat(60));

    // Create deck directory
    fs.mkdirSync(path.join(deckDir, 'resources', 'assets'), { recursive: true });
    fs.mkdirSync(path.join(deckDir, 'resources', 'materials'), { recursive: true });

    // Generate slides.md
    const slidesMd = generateSlidesMarkdown(context, slides);
    fs.writeFileSync(path.join(deckDir, 'slides.md'), slidesMd);
    console.log(`Created: ${path.join(deckDir, 'slides.md')}`);

    // Generate image prompts
    const promptsMd = generateImagePrompts(context, slides, entityProfile);
    fs.writeFileSync(path.join(deckDir, 'resources', 'materials', 'image-prompts.md'), promptsMd);
    console.log(`Created: ${path.join(deckDir, 'resources', 'materials', 'image-prompts.md')}`);

    // Generate index.html
    if (fs.existsSync(templatePath)) {
      const indexHtml = generateIndexHtml(context, slides, templatePath);
      fs.writeFileSync(path.join(deckDir, 'index.html'), indexHtml);
      console.log(`Created: ${path.join(deckDir, 'index.html')}`);
    } else {
      console.log(`Warning: Template not found at ${templatePath}`);
      console.log('Skipping index.html generation. Run new-deck.sh first or copy template manually.');
    }

    // Generate deck.json
    const deckJson = {
      id: deckId,
      title: context.title,
      entity: entity,
      oneThink: context.oneThink,
      audience: context.audience,
      action: context.action,
      delivery: context.delivery,
      constraints: context.constraints || null,
      slideCount: slides.length,
      createdAt: new Date().toISOString(),
      slides: slides.map((s, i) => ({
        index: i + 1,
        headline: s.headline,
        point: s.point,
        visual: s.visual,
        layout: s.layout,
      })),
    };
    fs.writeFileSync(path.join(deckDir, 'deck.json'), JSON.stringify(deckJson, null, 2));
    console.log(`Created: ${path.join(deckDir, 'deck.json')}`);

    // Generate deck-config.js
    const configJs = `// ABOUTME: Deck configuration for Keynote-style slides.
// ABOUTME: Loaded before the main deck script.
window.KEYNOTE_DECK = ${JSON.stringify(deckJson, null, 2)};
`;
    fs.writeFileSync(path.join(deckDir, 'deck-config.js'), configJs);
    console.log(`Created: ${path.join(deckDir, 'deck-config.js')}`);

    console.log('\n' + '='.repeat(60));
    console.log('DECK CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`\nDeck directory: ${deckDir}`);
    console.log('\nNext steps:');
    console.log('  1. Review slides.md for the outline');
    console.log('  2. Use image-prompts.md to generate visuals');
    console.log('  3. Preview: scripts/serve-decks.sh then open http://localhost:8921/decks/' + deckId);
    console.log('  4. Review with: node scripts/deck-review.js decks/' + deckId);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
