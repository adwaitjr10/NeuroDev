import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";
dotenv.config();

export const createClaudeClient = () => {
  return new BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION || "us-east-1",
  });
};

export const invokeClaude = async ({
  prompt,
  modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0",
  temperature = parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.2,
  top_p = parseFloat(process.env.CLAUDE_TOP_P) || 0.9,
  top_k = parseInt(process.env.CLAUDE_TOP_K, 10) || 250,
  max_tokens = parseInt(process.env.CLAUDE_MAX_TOKENS, 10) || 8000,
  stop_sequences = [],
}) => {
  const client = createClaudeClient();

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens,
    temperature,
    top_p,
    top_k,
    stop_sequences,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await client.send(command);
  const responseBody = Buffer.from(response.body).toString("utf-8");
  const parsed = JSON.parse(responseBody);

  return parsed.content?.[0]?.text || parsed.completion?.content || parsed;
};
