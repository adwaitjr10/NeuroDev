// utils/verifier.js

import fs from 'fs/promises';
import path from 'path';
import glob from 'fast-glob';
import levenshtein from 'js-levenshtein';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'ap-south-1' });

// Recursively collect all relative file paths
const walkFiles = async (dir, base = dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(entry =>
      entry.isDirectory()
        ? walkFiles(path.join(dir, entry.name), base)
        : path.relative(base, path.join(dir, entry.name))
    )
  );
  return files.flat();
};

// Skip binary and irrelevant files
const isSkippable = (filename) => {
  return (
    filename.includes('/.git/') ||
    /\.(png|jpe?g|ico|lock|idx|pack|woff2?|ttf|map)$/i.test(filename)
  );
};

// Try to find a corresponding file in the migrated project
const findMatchingMigratedFile = async (filename, migratedRoot) => {
  const baseName = path.basename(filename, path.extname(filename));
  const matches = await glob(`**/${baseName}.*`, {
    cwd: migratedRoot,
    absolute: true,
  });
  return matches[0];
};

// Semantic comparison using Claude
const compareWithClaude = async (source, target) => {
  const prompt = `Compare the logic between the two controller methods. Did any filtering, mapping, or data transformation change? Return 1.0 if logic is identical.

Code A:
${source}

Code B:
${target}

Only respond with the numeric similarity score.`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 100,
      temperature: 0,
      top_p: 0.8,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    }),
  });

  const response = await client.send(command);
  const body = Buffer.from(response.body).toString('utf-8');
  const parsed = JSON.parse(body);
  const score = parseFloat(parsed?.content?.[0]?.text || '0');
  return Math.max(0, Math.min(score, 1));
};

// Compare all files between original and migrated projects
export const compareProjects = async (originalRoot, migratedRoot, semanticCompareFn = compareWithClaude) => {
  const originalFiles = await walkFiles(originalRoot);
  const results = [];

  for (const relPath of originalFiles) {
    if (isSkippable(relPath)) continue;

    const origPath = path.join(originalRoot, relPath);
    const migratedPath = await findMatchingMigratedFile(relPath, migratedRoot);

    if (!migratedPath) {
      results.push({ file: relPath, accuracy: 'N/A', error: 'Missing migrated version' });
      continue;
    }

    try {
      const [original, migrated] = await Promise.all([
        fs.readFile(origPath, 'utf-8'),
        fs.readFile(migratedPath, 'utf-8')
      ]);

      const accuracy = semanticCompareFn
        ? await semanticCompareFn(original, migrated)
        : 1 - levenshtein(original, migrated) / Math.max(original.length, migrated.length);

      results.push({
        file: relPath,
        accuracy: (accuracy * 100).toFixed(2) + '%'
      });
    } catch (e) {
      results.push({
        file: relPath,
        accuracy: 'N/A',
        error: 'Error reading files'
      });
    }
  }

  return results;
};
