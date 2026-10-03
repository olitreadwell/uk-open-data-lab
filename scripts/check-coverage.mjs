// Coverage floor for every workspace that produces a v8 summary.
//
// Vitest writes apps/web/coverage/coverage-summary.json and
// packages/ui/coverage/coverage-summary.json. The previous version of this
// script read coverage/coverage-summary.json at the repo root, which never
// exists, so it always exited 1 with "No coverage report found" and nothing
// called it. `npm run check` now calls it, so the floor is real.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const THRESHOLD = 80;
const METRICS = ['lines', 'statements', 'functions', 'branches'];
const WORKSPACE_ROOTS = ['apps', 'packages'];

function findCoverageSummaries(repoRoot) {
  const summaries = [];
  for (const root of WORKSPACE_ROOTS) {
    const rootPath = path.join(repoRoot, root);
    if (!existsSync(rootPath)) continue;
    for (const workspace of readdirSync(rootPath)) {
      const summaryPath = path.join(rootPath, workspace, 'coverage', 'coverage-summary.json');
      if (existsSync(summaryPath)) summaries.push({ workspace: `${root}/${workspace}`, summaryPath });
    }
  }
  return summaries;
}

const summaries = findCoverageSummaries(process.cwd());

if (summaries.length === 0) {
  console.error('No coverage report found. Run `npm run test:coverage` first.');
  process.exit(1);
}

let allPassed = true;

for (const { workspace, summaryPath } of summaries) {
  const { total } = JSON.parse(readFileSync(summaryPath, 'utf8'));
  for (const metric of METRICS) {
    const pct = total[metric].pct;
    const passed = pct >= THRESHOLD;
    if (!passed) allPassed = false;
    console.error(`  ${passed ? 'PASS' : 'FAIL'}: ${workspace} ${metric} ${pct}% (floor ${THRESHOLD}%)`);
  }
}

process.exit(allPassed ? 0 : 1);
