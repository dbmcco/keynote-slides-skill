#!/usr/bin/env node
/**
 * Unified Deck Review Runner
 *
 * Orchestrates all analysis scripts and aggregates results for model-mediated review.
 * This is the CODE LAYER - it gathers factual data from all analyzers.
 *
 * Scripts executed:
 * - visual-density.js: Text-to-image ratio, whitespace metrics
 * - design-quality.js: Typography, contrast, balance, grid alignment
 * - image-analysis.js: Image presence, alt text, prompts
 * - emotional-arc.js: Hook quality, tension/resolution, flow chain
 * - readability.js: FK grade, passive voice, jargon
 * - narrative-review.js: Arc, flow, redundancy
 *
 * Usage:
 *   node scripts/review-all.js decks/my-deck
 *   node scripts/review-all.js decks/my-deck --json
 *   node scripts/review-all.js decks/my-deck --serve (for design-quality Playwright)
 *
 * Outputs:
 *   - Console summary (default)
 *   - JSON to resources/materials/full-analysis.json (always)
 *   - Feeds deck-review.js agent prompts with real data
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;

// Analysis scripts to run (order matters for dependencies)
const ANALYZERS = [
  { name: 'visual-density', script: 'visual-density.js', type: 'static' },
  { name: 'image-analysis', script: 'image-analysis.js', type: 'static' },
  { name: 'narrative-review', script: 'narrative-review.js', type: 'static' },
  { name: 'emotional-arc', script: 'emotional-arc.js', type: 'static' },
  { name: 'readability', script: 'readability.js', type: 'static' },
  { name: 'design-quality', script: 'design-quality.js', type: 'playwright', needsServe: true },
];

function runAnalyzer(analyzer, deckPath, options = {}) {
  const scriptPath = path.join(SCRIPTS_DIR, analyzer.script);

  if (!fs.existsSync(scriptPath)) {
    return { error: `Script not found: ${analyzer.script}` };
  }

  const args = [scriptPath, deckPath, '--json'];
  if (options.serve && analyzer.needsServe) {
    args.push('--serve');
  }

  try {
    const result = spawnSync('node', args, {
      encoding: 'utf-8',
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (result.error) {
      return { error: result.error.message };
    }

    if (result.status !== 0) {
      return { error: result.stderr || `Exit code ${result.status}` };
    }

    // Parse JSON output
    try {
      return JSON.parse(result.stdout);
    } catch (e) {
      return { error: `JSON parse error: ${e.message}`, raw: result.stdout };
    }
  } catch (e) {
    return { error: e.message };
  }
}

function summarizeFindings(results) {
  const summary = {
    overall: {
      totalFlags: 0,
      flags: [],
      heuristicScore: null,
      heuristicGrade: null,
    },
    byCategory: {},
    northStarSignals: {
      storytelling: null,
      clarity: null,
      design: null,
      visualBalance: null,
    },
  };

  // Visual Density (Image > Text)
  if (results['visual-density'] && !results['visual-density'].error) {
    const vd = results['visual-density'];
    summary.byCategory.visualDensity = {
      avgWordsPerSlide: vd.deckAverages?.avgWordCount || 0,
      avgVisualsPerSlide: vd.deckAverages?.avgVisualCount || 0,
      slidesWithoutVisuals: vd.flagSummary?.flagsByType?.no_visuals_on_content_slide?.length || 0,
      flags: vd.flagSummary?.totalFlags || 0,
    };

    // Score: Lower words + more visuals = better
    const wordScore = Math.max(0, 100 - (vd.deckAverages?.avgWordCount || 0) * 2);
    const visualScore = Math.min(100, (vd.deckAverages?.avgVisualCount || 0) * 50);
    summary.northStarSignals.visualBalance = Math.round((wordScore + visualScore) / 2);

    const noVisualSlides = vd.flagSummary?.flagsByType?.no_visuals_on_content_slide || [];
    if (noVisualSlides.length > 0) {
      summary.overall.flags.push({
        category: 'visual-density',
        signal: 'no-visuals-on-content-slide',
        message: `${noVisualSlides.length} content slide(s) missing visuals`,
        slides: noVisualSlides.map((f) => f.slideIndex),
      });
    }

    const highWordSlides = vd.flagSummary?.flagsByType?.high_word_count || [];
    if (highWordSlides.length > 0) {
      summary.overall.flags.push({
        category: 'visual-density',
        signal: 'high-word-count',
        message: `${highWordSlides.length} slide(s) have too much text`,
        slides: highWordSlides.map((f) => f.slideIndex),
      });
    }
  }

  // Emotional Arc (Compelling Storytelling)
  if (results['emotional-arc'] && !results['emotional-arc'].error) {
    const ea = results['emotional-arc'];
    summary.byCategory.emotionalArc = {
      hookGrade: ea.hookAnalysis?.overallGrade || 'unknown',
      arcShape: ea.emotionalArc?.arcShape?.shape || 'unknown',
      flowGaps: ea.flowChain?.gapCount || 0,
      recommendations: ea.summary?.recommendations || [],
    };

    // Score storytelling
    const hookScores = { provocative: 100, interesting: 75, informational: 50, weak: 25 };
    const hookScore = hookScores[ea.hookAnalysis?.overallGrade] || 50;
    const arcShapes = {
      'builds-then-resolves': 100,
      'front-loaded': 80,
      mixed: 60,
      flat: 30,
      chaotic: 20,
      'all-positive': 40,
      'all-negative': 30,
    };
    const arcScore = arcShapes[ea.emotionalArc?.arcShape?.shape] || 50;
    const flowScore = Math.max(0, 100 - (ea.flowChain?.gapCount || 0) * 20);
    summary.northStarSignals.storytelling = Math.round((hookScore + arcScore + flowScore) / 3);

    if (ea.hookAnalysis?.overallGrade === 'weak') {
      summary.overall.flags.push({
        category: 'storytelling',
        signal: 'weak-hook',
        message: 'Weak opening hook - needs provocative or interesting opener',
      });
    }

    if (ea.flowChain?.gapCount > 2) {
      summary.overall.flags.push({
        category: 'storytelling',
        signal: 'flow-gaps',
        message: `${ea.flowChain.gapCount} flow gaps - slides don't connect logically`,
      });
    }
  }

  // Readability (Clear Messaging)
  if (results['readability'] && !results['readability'].error) {
    const rd = results['readability'];
    summary.byCategory.readability = {
      avgGradeLevel: rd.deckAverage?.fleschKincaidGrade || null,
      passiveVoicePercent: rd.deckAverage?.passiveVoicePercent || 0,
      jargonDensity: rd.deckAverage?.jargonDensity || 0,
      complexSentences: rd.summary?.totalComplexSentences || 0,
    };

    // Score clarity (lower grade = better, less passive = better, less jargon = better)
    const gradeScore = Math.max(0, 100 - ((rd.deckAverage?.fleschKincaidGrade || 8) - 6) * 10);
    const passiveScore = Math.max(0, 100 - (rd.deckAverage?.passiveVoicePercent || 0) * 3);
    const jargonScore = Math.max(0, 100 - (rd.deckAverage?.jargonDensity || 0) * 10);
    summary.northStarSignals.clarity = Math.round((gradeScore + passiveScore + jargonScore) / 3);

    if ((rd.deckAverage?.fleschKincaidGrade || 0) > 10) {
      summary.overall.flags.push({
        category: 'readability',
        signal: 'high-grade-level',
        message: `High reading grade level: ${rd.deckAverage?.fleschKincaidGrade?.toFixed(1)} (target: <10)`,
      });
    }

    if ((rd.deckAverage?.jargonDensity || 0) > 5) {
      summary.overall.flags.push({
        category: 'readability',
        signal: 'high-jargon-density',
        message: `High jargon density: ${rd.deckAverage?.jargonDensity?.toFixed(1)}%`,
      });
    }
  }

  // Design Quality
  if (results['design-quality'] && !results['design-quality'].error) {
    const dq = results['design-quality'];
    summary.byCategory.designQuality = {
      totalFlags: dq.summary?.totalFlags || 0,
      byType: dq.summary?.byType || {},
      bySeverity: dq.summary?.bySeverity || {},
    };

    // Score design based on flags
    const highFlags = dq.summary?.bySeverity?.high || 0;
    const mediumFlags = dq.summary?.bySeverity?.medium || 0;
    const designScore = Math.max(0, 100 - highFlags * 20 - mediumFlags * 10);
    summary.northStarSignals.design = designScore;

    const highSeverity = dq.flags?.filter((f) => f.severity === 'high') || [];
    if (highSeverity.length > 0) {
      summary.overall.flags.push({
        category: 'design',
        signal: 'high-severity-design',
        message: `${highSeverity.length} high-severity design issue(s)`,
        details: highSeverity.slice(0, 3).map((f) => f.message),
      });
    }
  }

  // Calculate overall heuristic score
  const scores = Object.values(summary.northStarSignals).filter((s) => s !== null);
  summary.overall.heuristicScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  // Grade
  if (summary.overall.heuristicScore !== null) {
    if (summary.overall.heuristicScore >= 85) summary.overall.heuristicGrade = 'A';
    else if (summary.overall.heuristicScore >= 70) summary.overall.heuristicGrade = 'B';
    else if (summary.overall.heuristicScore >= 55) summary.overall.heuristicGrade = 'C';
    else if (summary.overall.heuristicScore >= 40) summary.overall.heuristicGrade = 'D';
    else summary.overall.heuristicGrade = 'F';
  }

  summary.overall.totalFlags = summary.overall.flags.length;

  return summary;
}

function printSummary(summary, deckPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`DECK REVIEW SUMMARY: ${deckPath}`);
  console.log(`${'='.repeat(60)}`);

  // North Star Scores
  console.log('\n--- NORTH STAR ALIGNMENT ---\n');
  console.log('  Compelling Storytelling:    ' + formatScore(summary.northStarSignals.storytelling));
  console.log('  Clear Messaging:            ' + formatScore(summary.northStarSignals.clarity));
  console.log('  Beautiful Design:           ' + formatScore(summary.northStarSignals.design));
  console.log('  Image > Text Balance:       ' + formatScore(summary.northStarSignals.visualBalance));
  console.log('');
  console.log(`  OVERALL (heuristic): ${summary.overall.heuristicGrade || 'N/A'} (${summary.overall.heuristicScore || 'N/A'}%)`);

  // Signals (model decides severity)
  if (summary.overall.flags.length > 0) {
    console.log('\n--- SIGNALS (model decides priority) ---\n');
    summary.overall.flags.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.category}] ${issue.message}`);
      if (issue.slides) console.log(`     Slides: ${issue.slides.join(', ')}`);
      if (issue.details) issue.details.forEach((d) => console.log(`     - ${d}`));
    });
  }

  // Quick Stats
  console.log('\n--- QUICK STATS ---\n');
  if (summary.byCategory.visualDensity) {
    const vd = summary.byCategory.visualDensity;
    console.log(`  Avg words/slide: ${vd.avgWordsPerSlide} | Avg visuals/slide: ${vd.avgVisualsPerSlide}`);
  }
  if (summary.byCategory.readability) {
    const rd = summary.byCategory.readability;
    console.log(`  Reading grade: ${rd.avgGradeLevel?.toFixed(1) || 'N/A'} | Jargon: ${rd.jargonDensity?.toFixed(1)}%`);
  }
  if (summary.byCategory.emotionalArc) {
    const ea = summary.byCategory.emotionalArc;
    console.log(`  Hook: ${ea.hookGrade} | Arc: ${ea.arcShape} | Flow gaps: ${ea.flowGaps}`);
  }

  console.log('\n' + '='.repeat(60));
}

function formatScore(score) {
  if (score === null) return 'N/A';
  const bar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10));
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  return `${bar} ${score}% (${grade})`;
}

async function main() {
  const args = process.argv.slice(2);
  const deckPath = args.find((a) => !a.startsWith('--')) || 'decks/skill-demo';
  const outputJson = args.includes('--json');
  const serve = args.includes('--serve');

  // Validate deck exists
  const htmlPath = path.join(deckPath, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`Deck not found: ${htmlPath}`);
    process.exit(1);
  }

  console.log(`\nRunning comprehensive deck analysis: ${deckPath}`);
  console.log('='.repeat(50));

  const results = {};
  const errors = [];

  // Run each analyzer
  for (const analyzer of ANALYZERS) {
    process.stdout.write(`  ${analyzer.name}... `);

    // Skip Playwright scripts if not serving
    if (analyzer.type === 'playwright' && !serve) {
      console.log('SKIPPED (use --serve)');
      continue;
    }

    const result = runAnalyzer(analyzer, deckPath, { serve });

    if (result.error) {
      console.log(`ERROR: ${result.error}`);
      errors.push({ analyzer: analyzer.name, error: result.error });
    } else {
      console.log('OK');
      results[analyzer.name] = result;
    }
  }

  // Summarize findings
  const summary = summarizeFindings(results);

  // Full report
  const fullReport = {
    deckPath,
    analyzedAt: new Date().toISOString(),
    summary,
    rawResults: results,
    errors,
  };

  // Save to file
  const outputDir = path.join(deckPath, 'resources', 'materials');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'full-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(fullReport, null, 2));
  console.log(`\nFull analysis saved to: ${outputPath}`);

  // Output
  if (outputJson) {
    console.log(JSON.stringify(fullReport, null, 2));
  } else {
    printSummary(summary, deckPath);
  }

}

main().catch(console.error);
