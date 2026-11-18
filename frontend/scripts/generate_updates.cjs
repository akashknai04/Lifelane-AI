const fs = require('fs');
const path = require('path');

const progressPath = path.resolve(__dirname, '../../PROGRESS.md');
const outputPath = path.resolve(__dirname, '../src/data/projectUpdates.json');

try {
  const content = fs.readFileSync(progressPath, 'utf8');
  
  // Parse phases from Section 3
  const phaseRegex = /### Phase (\d+) — ([^\n]+)\n([\s\S]*?)(?=(### Phase|\n## |\n---|$))/g;
  const updates = [];
  let match;

  while ((match = phaseRegex.exec(content)) !== null) {
    const phaseNum = match[1];
    const phaseTitle = match[2].trim();
    const phaseBody = match[3];

    // Extract Goal
    const goalMatch = /\* \*\*Goal:\*\* ([^\n]+)/.exec(phaseBody);
    const goal = goalMatch ? goalMatch[1].trim() : "Phase milestone implementation.";

    // Extract What was built items
    const builtItems = [];
    const itemRegex = /\* `([^`]+)`: ([^\n]+)/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(phaseBody)) !== null && builtItems.length < 4) {
      builtItems.push(path.basename(itemMatch[1]));
    }

    // Determine badge
    let badge = "Completed";
    if (phaseNum === "2") badge = "Active Release";
    if (parseInt(phaseNum) > 2) badge = "Planned";

    updates.push({
      phase: `Phase 0${phaseNum} · ${phaseTitle.split('(')[0].trim()}`,
      date: "Oct 16, 2026",
      title: phaseTitle,
      summary: goal,
      badge: badge,
      deliverables: builtItems.length > 0 ? builtItems : [`Phase ${phaseNum} Core Specs`]
    });
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(updates.slice(0, 3), null, 2), 'utf8');
  console.log(`[generate_updates] Successfully generated ${updates.length} updates from PROGRESS.md -> ${outputPath}`);
} catch (err) {
  console.error('[generate_updates] Error parsing PROGRESS.md:', err);
  process.exit(1);
}
