import path from 'path';
import fs from 'fs/promises';
import { compareProjects } from '../../utils/verifier.js';
import { prepareClaudePayload } from '../../utils/payloadUtils.js';
import { invokeClaude } from '../../llms/claudeModel.js';
import { migrationPromptTemplate } from '../../prompts/migrationPrompt.js';

const invokeClaudeWithTimeout = (args, timeoutMs = 30000) => {
  return Promise.race([
    invokeClaude(args),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Claude timeout after " + timeoutMs + "ms")), timeoutMs)),
  ]);
};

const retry = async (fn, attempts = 3, delay = 2000) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      console.warn(`Retry ${i + 1}/${attempts} failed: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

export const runPatchMigration = async (filesToPatch = []) => {
  const originalRoot = path.resolve('workspace');
  const migratedRoot = path.resolve('workspace/migrated-project');

  const results = await compareProjects(originalRoot, migratedRoot);

  const normalize = p => path.resolve(p).replace(/\\/g, '/');
  const normalizedPatchList = filesToPatch.map(normalize);

  const filteredResults = results.filter(r =>
    normalizedPatchList.includes(normalize(r.file))
  );

  if (!filteredResults.length) {
    console.log("No matching files to patch.");
    return;
  }

  let patchedCount = 0;
  let skippedCount = 0;

  for (const result of filteredResults) {
    const relativeFile = path.relative(originalRoot, result.file);
    const originalFilePath = path.resolve(originalRoot, relativeFile);
    console.log(` Comparing result.file=${result.file} vs originalFilePath=${originalFilePath}`);

    const fileExists = await fs.stat(originalFilePath).then(() => true).catch(() => false);
    if (!fileExists) {
      console.warn(`Original file missing: ${originalFilePath}`);
      skippedCount++;
      continue;
    }

    console.log(`\nPatching: ${relativeFile} (Accuracy: ${result.accuracy})`);

    const payload = await prepareClaudePayload([originalFilePath], "Please migrate this file", "AUTO");

    const finalPrompt = await migrationPromptTemplate.format({
      targetLanguage: 'AUTO',
      userRequest: 'Patch missing or low-accuracy file.',
      projectFiles: payload,
    });

    try {
      const res = await retry(() =>
        invokeClaudeWithTimeout({ prompt: finalPrompt }, 30000)
      );

      const migratedCode = typeof res === 'string'
        ? res
        : res?.text || res?.content?.[0]?.text || res?.completion?.content || '';

      if (migratedCode.trim()) {
        const migratedFilePath = path.join(migratedRoot, relativeFile);
        await fs.mkdir(path.dirname(migratedFilePath), { recursive: true });
        await fs.writeFile(migratedFilePath, migratedCode.trim(), 'utf-8');
        console.log(`Patched: ${relativeFile}`);
        patchedCount++;
      } else {
        console.warn(`No valid output received for: ${relativeFile}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`Failed to patch ${relativeFile}: ${error.message}`);
      skippedCount++;
    }
  }

  console.log(`\nPatch Summary:
 Patched files: ${patchedCount}
 Skipped files (errors or invalid output): ${skippedCount}`);
};
