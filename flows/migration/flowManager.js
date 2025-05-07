// migration/flowManager.js

import { prepareClaudePayload, sendToClaude } from "../../utils/payloadUtils.js";
import { smartChunkFiles } from "./chunker.js";
import { migrationPromptTemplate } from "../../prompts/migrationPrompt.js";
import { saveClaudeOutput } from "./outputSaver.js";
import { countTokens } from "@anthropic-ai/tokenizer";
import { extractPLSQLBlocks } from "./structureParser.js";
import { runPatchMigration } from "./patchMissing.js";
import { compareProjects } from "../../utils/verifier.js";

export const runMigrationFlow = async (selectedFiles, userRequest, targetLanguage) => {
  console.log(`\n Starting full migration flow for ${selectedFiles.length} files...`);

  const compiledFiles = await prepareClaudePayload(selectedFiles);
  console.log("📄 Compiled files:", compiledFiles.map(f => f.path));

  const promptBlocks = compiledFiles.flatMap(f => {
    if (f.path.endsWith(".sql")) {
      const blocks = extractPLSQLBlocks(f.content);
      console.log(`📑 Extracted ${blocks.length} logical blocks from ${f.path}`);
      return blocks.map((b, i) => `File: ${f.path} (block ${i + 1})\nContent:\n${b}`);
    } else {
      return [`File: ${f.path}\nContent:\n${f.content}`];
    }
  });

  const chunks = smartChunkFiles(promptBlocks, 80000);
  console.log(`🔗 Token-safe chunks prepared: ${chunks.length}`);

  const responses = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkIndex = i + 1;

    const prompt = await migrationPromptTemplate.format({
      targetLanguage,
      userRequest,
      projectFiles: chunk.join("\n\n"),
    });

    console.log(`\n Sending chunk ${chunkIndex}/${chunks.length} to Claude...`);
    console.log(` Token count: ${countTokens(prompt)}\n`);

    try {
      const result = await sendToClaude(prompt);
      const text = result.text || result;

      console.log(`Claude responded for chunk ${chunkIndex} (${result.outputTokens} output tokens)`);
      await saveClaudeOutput(text, chunkIndex);

      responses.push(text);
    } catch (err) {
      console.error(`Claude error on chunk ${chunkIndex}:`, err);
      responses.push(`Error in chunk ${chunkIndex}: ${err.message}`);
    }
  }

  console.log("\nRunning post-migration verification...");
  const verificationResults = await compareProjects("workspace", "workspace/migrated-project");

  const failedFiles = verificationResults.filter(file =>
    file.accuracy === 'N/A' || parseFloat(file.accuracy) < 80
  );

  if (failedFiles.length > 0) {
    console.log(`${failedFiles.length} files need patching. Running fix loop...`);
    await runPatchMigration(failedFiles.map(f => f.file));
  } else {
    console.log("All files passed verification.");
  }

  console.log("\n Migration flow completed.");
  return {
    status: 'complete',
    migratedFiles: compiledFiles.map(f => f.path),
    patchedFiles: failedFiles.map(f => f.file),
    responses: responses,
  };
};
