// flows/buildProjectFlow.js
import { StateGraph } from "@langchain/langgraph";
import { invokeClaude } from "../llms/claudeModel.js";
import { buildPromptTemplate } from "../prompts/buildPrompt.js";
import { parseAndSaveBatch } from "../utils/payloadUtils.js";

// Define the state schema
const graphState = {
  buildResult: {
    value: null,
  },
};

export const buildProjectFlow = async (userRequest) => {
  const finalPrompt = await buildPromptTemplate.format({ userRequest });

  const nodes = {
    build: async (state) => {
      const response = await invokeClaude({ prompt: finalPrompt });
      const outputText = response.content?.[0]?.text || response;
      await parseAndSaveBatch(outputText);
      return { buildResult: outputText };
    },
  };

  const graph = new StateGraph({ channels: graphState })
    .addNode("build", nodes.build)
    .setEntryPoint("build");
  
  const app = graph.compile();
  const result = await app.invoke({});
  return result.buildResult;
};
