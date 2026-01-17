#!/usr/bin/env node
/**
 * Generate images using Gemini nano banana (gemini-2.5-flash-image)
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node scripts/generate-image.js "prompt" output.png
 *   node scripts/generate-image.js --batch decks/skill-demo
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const IMAGE_MODEL = 'gemini-2.5-flash-image'; // nano banana - Gemini with image output

// Brand-aware prompt prefix
const BRAND_PREFIX = 'Generate an image: Editorial illustration style, warm parchment palette with orange and sage accents, crisp linework, minimal shadows, clean modern aesthetic.';

async function generateImage(prompt, outputPath) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable required');
  }

  const fullPrompt = `${BRAND_PREFIX} ${prompt}`;
  console.log(`Generating: ${prompt.slice(0, 50)}...`);

  const response = await fetch(`${API_BASE}/models/${IMAGE_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  // Debug: log the response structure
  if (process.env.DEBUG) {
    console.log('Response:', JSON.stringify(data, null, 2).slice(0, 1000));
  }

  // Find image in response parts
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData || p.inline_data);
  const inlineData = imagePart?.inlineData || imagePart?.inline_data;

  if (!inlineData?.data) {
    const textPart = parts.find((p) => p.text);
    if (textPart?.text) {
      throw new Error(`Model response: ${textPart.text.slice(0, 150)}`);
    }
    throw new Error('No image data returned');
  }

  const buffer = Buffer.from(inlineData.data, 'base64');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved: ${outputPath}`);
  return outputPath;
}

// Images needed for skill-demo
const BATCH_IMAGES = [
  {
    name: 'resources-folder.png',
    prompt:
      'Isometric illustration of organized folders with documents, company logos, and data charts flowing into a presentation slide. Clean vector style, warm paper texture background.',
  },
  {
    name: 'cli-workflow.png',
    prompt:
      'Clean terminal window illustration showing a conversation with an AI assistant refining presentation slides. Dark terminal theme with syntax highlighting, command prompts, and progress indicators.',
  },
  {
    name: 'template-preview.png',
    prompt:
      'Grid of 6 presentation slide templates showing different layouts: title slide, split layout with image, metrics with big numbers, quote slide, diagram/flowchart, and 3-card gallery. Clean keynote style.',
  },
  {
    name: 'brand-tokens.png',
    prompt:
      'Brand identity system overview showing color palette swatches (dark ink, orange accent, sage green, slate gray), typography samples (serif display font, sans-serif body), and visual style chips.',
  },
];

async function batchGenerate(deckPath) {
  const assetsDir = path.join(deckPath, 'resources', 'assets');

  for (const img of BATCH_IMAGES) {
    const outputPath = path.join(assetsDir, img.name);
    try {
      await generateImage(img.prompt, outputPath);
    } catch (error) {
      console.error(`Failed ${img.name}: ${error.message}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--batch') {
    const deckPath = args[1] || 'decks/skill-demo';
    await batchGenerate(deckPath);
    return;
  }

  if (args.length < 2) {
    console.log('Usage:');
    console.log('  node scripts/generate-image.js "prompt" output.png');
    console.log('  node scripts/generate-image.js --batch decks/skill-demo');
    process.exit(1);
  }

  const [prompt, outputPath] = args;
  await generateImage(prompt, outputPath);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
