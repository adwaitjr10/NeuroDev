// utils/safeChunker.js
import fs from 'fs/promises';
import { countTokens } from '@anthropic-ai/tokenizer';
import path from 'path';

export const splitFileIntoSafeChunks = async (filePath, maxTokens = 6000, overlap = 200) => {
  const raw = await fs.readFile(filePath, 'utf-8');
  const lines = raw.split('\n');
  const chunks = [];

  let currentChunk = [], currentTokens = 0, chunkStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tokens = countTokens(line);

    // Skip extremely long lines but log
    if (tokens > maxTokens) {
      console.warn(`⚠️ Skipping very long line in ${filePath}:\n${line.slice(0, 100)}`);
      continue;
    }

    if (currentTokens + tokens > maxTokens) {
      chunks.push({
        content: currentChunk.join('\n'),
        startLine: chunkStartLine,
        endLine: i - 1,
      });

      // Add overlap from last chunk
      i = i - Math.min(overlap, currentChunk.length);
      currentChunk = [];
      currentTokens = 0;
      chunkStartLine = i;
      continue;
    }

    currentChunk.push(line);
    currentTokens += tokens;
  }

  // Final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join('\n'),
      startLine: chunkStartLine,
      endLine: lines.length - 1,
    });
  }

  return chunks;
};
