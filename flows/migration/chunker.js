import { countTokens } from "@anthropic-ai/tokenizer";

export const smartChunkFiles = (fileBlocks, maxTokens = 80000) => {
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;

  for (const block of fileBlocks) {
    const tokenCount = countTokens(block);

    if (tokenCount > maxTokens) {
      console.warn(`⚠️ Block exceeds token limit (${tokenCount} tokens). Splitting manually.`);
      const subChunks = splitLargeBlock(block, maxTokens);
      for (const sub of subChunks) {
        chunks.push([sub]);
      }
      continue;
    }

    if (currentTokens + tokenCount > maxTokens) {
      chunks.push([...currentChunk]);
      currentChunk = [];
      currentTokens = 0;
    }

    currentChunk.push(block);
    currentTokens += tokenCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

function splitLargeBlock(block, maxTokens) {
  const lines = block.split("\n");
  const result = [];
  let chunk = [];
  let tokens = 0;

  for (const line of lines) {
    const t = countTokens(line);
    if (tokens + t > maxTokens) {
      result.push(chunk.join("\n"));
      chunk = [];
      tokens = 0;
    }
    chunk.push(line);
    tokens += t;
  }

  if (chunk.length > 0) {
    result.push(chunk.join("\n"));
  }

  return result;
}
