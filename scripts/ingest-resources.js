#!/usr/bin/env node
/**
 * Resource Ingestion for Narrative Engine Integration
 *
 * Reads all materials from a deck's resources folder and outputs
 * a structured summary for model synthesis.
 *
 * Usage:
 *   node scripts/ingest-resources.js decks/<deck-id>
 *   node scripts/ingest-resources.js decks/<deck-id> --json
 */

const fs = require('fs');
const path = require('path');

const SUPPORTED_TEXT_EXTENSIONS = ['.md', '.txt', '.json', '.csv', '.html'];
const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const SUPPORTED_DATA_EXTENSIONS = ['.csv', '.json', '.xlsx'];

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  if (SUPPORTED_DATA_EXTENSIONS.includes(ext)) return 'data';
  if (ext === '.md') return 'markdown';
  return 'text';
}

function readTextFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    return {
      filename: path.basename(filePath),
      path: filePath,
      type: getFileType(filePath),
      size: stats.size,
      modified: stats.mtime.toISOString(),
      content: content,
      lineCount: content.split('\n').length,
      wordCount: content.split(/\s+/).filter((w) => w).length,
    };
  } catch (err) {
    return {
      filename: path.basename(filePath),
      path: filePath,
      type: getFileType(filePath),
      error: err.message,
    };
  }
}

function readImageFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      filename: path.basename(filePath),
      path: filePath,
      type: 'image',
      size: stats.size,
      modified: stats.mtime.toISOString(),
      // Don't include binary content, just metadata
      sizeKB: Math.round(stats.size / 1024),
    };
  } catch (err) {
    return {
      filename: path.basename(filePath),
      path: filePath,
      type: 'image',
      error: err.message,
    };
  }
}

function scanDirectory(dirPath, basePath = '') {
  const results = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      results.push(...scanDirectory(fullPath, relativePath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();

      if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
        results.push(readImageFile(fullPath));
      } else if (SUPPORTED_TEXT_EXTENSIONS.includes(ext)) {
        results.push(readTextFile(fullPath));
      } else if (ext === '.pdf') {
        // Note PDF exists but can't read content directly
        results.push({
          filename: entry.name,
          path: fullPath,
          type: 'pdf',
          size: fs.statSync(fullPath).size,
          note: 'PDF detected - extract text separately if needed',
        });
      }
    }
  }

  return results;
}

function ingestResources(deckPath) {
  const materialsPath = path.join(deckPath, 'resources', 'materials');
  const assetsPath = path.join(deckPath, 'resources', 'assets');

  const materials = scanDirectory(materialsPath);
  const assets = scanDirectory(assetsPath);

  // Read deck config if exists
  let deckConfig = null;
  const configPath = path.join(deckPath, 'deck.json');
  if (fs.existsSync(configPath)) {
    try {
      deckConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      deckConfig = { error: e.message };
    }
  }

  // Read existing narrative context if exists
  let narrativeContext = null;
  const narrativePath = path.join(deckPath, 'narrative-context.json');
  if (fs.existsSync(narrativePath)) {
    try {
      narrativeContext = JSON.parse(fs.readFileSync(narrativePath, 'utf-8'));
    } catch (e) {
      narrativeContext = { error: e.message };
    }
  }

  return {
    deckPath,
    deckConfig,
    narrativeContext,
    materials: {
      count: materials.length,
      totalWordCount: materials
        .filter((m) => m.wordCount)
        .reduce((sum, m) => sum + m.wordCount, 0),
      files: materials,
    },
    assets: {
      count: assets.length,
      images: assets.filter((a) => a.type === 'image'),
      other: assets.filter((a) => a.type !== 'image'),
    },
    summary: {
      hasBrief: materials.some(
        (m) => m.filename.toLowerCase().includes('brief') || m.filename === 'brief.md'
      ),
      hasData: materials.some((m) => m.type === 'data'),
      hasResearch: materials.some(
        (m) =>
          m.filename.toLowerCase().includes('research') ||
          m.filename.toLowerCase().includes('study')
      ),
      hasNotes: materials.some(
        (m) =>
          m.filename.toLowerCase().includes('note') || m.filename.toLowerCase().includes('draft')
      ),
      imageCount: assets.filter((a) => a.type === 'image').length,
    },
  };
}

function formatForModel(ingestion) {
  let output = `# Resource Ingestion Summary\n\n`;
  output += `**Deck:** ${ingestion.deckPath}\n\n`;

  // Deck config
  if (ingestion.deckConfig && !ingestion.deckConfig.error) {
    output += `## Deck Configuration\n`;
    output += `- Entity: ${ingestion.deckConfig.entity || 'not set'}\n`;
    output += `- Title: ${ingestion.deckConfig.title || 'not set'}\n`;
    output += `- Type: ${ingestion.deckConfig.deckType || 'not set'}\n\n`;
  }

  // Existing narrative context
  if (ingestion.narrativeContext && !ingestion.narrativeContext.error) {
    output += `## Existing Narrative Context\n`;
    output += `Previous discovery completed: ${ingestion.narrativeContext.created || 'unknown'}\n`;
    output += `Framework: ${ingestion.narrativeContext.framework?.name || 'not selected'}\n\n`;
  }

  // Materials summary
  output += `## Materials (${ingestion.materials.count} files, ~${ingestion.materials.totalWordCount} words)\n\n`;

  if (ingestion.summary.hasBrief) output += `- Has brief document\n`;
  if (ingestion.summary.hasData) output += `- Has data files\n`;
  if (ingestion.summary.hasResearch) output += `- Has research documents\n`;
  if (ingestion.summary.hasNotes) output += `- Has notes/drafts\n`;

  output += `\n### Material Contents\n\n`;

  for (const material of ingestion.materials.files) {
    if (material.error) {
      output += `#### ${material.filename} (error: ${material.error})\n\n`;
    } else if (material.content) {
      output += `#### ${material.filename}\n`;
      output += `*Type: ${material.type} | ${material.wordCount} words | ${material.lineCount} lines*\n\n`;
      output += '```\n';
      // Truncate very long files
      const maxChars = 10000;
      if (material.content.length > maxChars) {
        output += material.content.slice(0, maxChars);
        output += `\n\n... [truncated, ${material.content.length - maxChars} more characters]\n`;
      } else {
        output += material.content;
      }
      output += '\n```\n\n';
    } else {
      output += `#### ${material.filename}\n`;
      output += `*Type: ${material.type} | ${material.note || 'binary file'}*\n\n`;
    }
  }

  // Assets summary
  output += `## Visual Assets (${ingestion.assets.count} files)\n\n`;

  if (ingestion.assets.images.length > 0) {
    output += `### Images Available\n`;
    for (const img of ingestion.assets.images) {
      output += `- ${img.filename} (${img.sizeKB}KB)\n`;
    }
    output += `\n`;
  }

  if (ingestion.assets.other.length > 0) {
    output += `### Other Assets\n`;
    for (const asset of ingestion.assets.other) {
      output += `- ${asset.filename}\n`;
    }
    output += `\n`;
  }

  return output;
}

// Main execution
const args = process.argv.slice(2);
const deckPath = args.find((a) => !a.startsWith('--'));
const jsonOutput = args.includes('--json');

if (!deckPath) {
  console.error('Usage: node scripts/ingest-resources.js decks/<deck-id> [--json]');
  process.exit(1);
}

if (!fs.existsSync(deckPath)) {
  console.error(`Deck path not found: ${deckPath}`);
  process.exit(1);
}

const ingestion = ingestResources(deckPath);

if (jsonOutput) {
  console.log(JSON.stringify(ingestion, null, 2));
} else {
  console.log(formatForModel(ingestion));
}
