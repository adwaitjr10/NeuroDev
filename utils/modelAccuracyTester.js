import { invokeClaude } from "../llms/claudeModel.js";
import levenshtein from "js-levenshtein";
import { performance } from "perf_hooks";
import { getTokenizer } from "@anthropic-ai/tokenizer";

const tokenizer = getTokenizer();

const pricingINR = {
  "anthropic.claude-3-haiku-20240307-v1:0": { input: 0.02075, output: 0.10375 },
  "anthropic.claude-3-sonnet-20240229-v1:0": { input: 0.249, output: 1.245 },
  "anthropic.claude-3-opus-20240229-v1:0": { input: 0.83, output: 2.49 },
};

const models = [
  { name: "Claude 3 Haiku", modelId: "anthropic.claude-3-haiku-20240307-v1:0" },
  { name: "Claude 3 Sonnet", modelId: "anthropic.claude-3-sonnet-20240229-v1:0" },
  // { name: "Claude 3 Opus", modelId: "anthropic.claude-3-opus-20240229-v1:0" },
];

// Token estimation using Anthropic tokenizer
const estimateTokens = (text) => tokenizer.encode(text).length;

export const splitLargeFileIntoChunks = (content, maxTokens = 6000) => {
  const lines = content.split('\n');
  const chunks = [];
  let currentChunk = '';
  let currentTokenCount = 0;

  for (const line of lines) {
    const lineTokenCount = encode(line).length;
    if (currentTokenCount + lineTokenCount > maxTokens) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
      currentTokenCount = 0;
    }
    currentChunk += line + '\n';
    currentTokenCount += lineTokenCount;
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  return chunks;
};
export const testModels = async ({ prompt, expectedAnswer }) => {
  const results = [];

  for (const { name, modelId } of models) {
    const t0 = performance.now();
    try {
      const output = await invokeClaude({ prompt, modelId });
      const t1 = performance.now();

      const normalized = output.toLowerCase().trim();
      const expected = expectedAnswer.toLowerCase().trim();
      const levDist = levenshtein(normalized, expected);
      const similarity = 1 - levDist / Math.max(normalized.length, expected.length);
      const score = Math.round(similarity * 100);

      const inputTokens = estimateTokens(prompt);
      const outputTokens = estimateTokens(output);
      const price = pricingINR[modelId];
      const costINR = ((inputTokens * price.input + outputTokens * price.output) / 1000).toFixed(4);
      const latencyMs = Math.round(t1 - t0);

      const verdict =
        score > 90
          ? "Highly Accurate"
          : score > 70
          ? "Good"
          : score > 50
          ? "Acceptable"
          : "Poor Match";

      results.push({
        name,
        modelId,
        score,
        inputTokens,
        outputTokens,
        costINR,
        latencyMs,
        verdict,
        output,
      });
    } catch (err) {
      results.push({
        name,
        modelId,
        score: 0,
        inputTokens: 0,
        outputTokens: 0,
        costINR: "0.0000",
        latencyMs: 0,
        verdict: "Failed",
        error: err.message,
      });
    }
  }

  return results;
};
