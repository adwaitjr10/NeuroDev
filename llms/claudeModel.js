import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export const createClaudeClient = () => {
  return new BedrockRuntimeClient({ region: "ap-south-1" });
};

export const invokeClaude = async ({
  prompt,
  modelId = "anthropic.claude-3-sonnet-20240229-v1:0",
  temperature = 0.2,
  top_p = 0.9,
  top_k = 250,
  max_tokens = 8000,
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
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
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
