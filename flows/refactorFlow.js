import { StateGraph } from "@langchain/langgraph";
import { invokeClaude } from "../llms/claudeModel.js";
import { refactorPromptTemplate } from "../prompts/refactorPrompt.js";
import { prepareClaudePayload, parseAndSaveBatch } from "../utils/payloadUtils.js";

// Define the state schema
const graphState = {
  refactorResult: {
    value: null,
  },
};

export const refactorFlow = async (selectedFiles, userRequest) => {
  const compiledProjectFiles = await prepareClaudePayload(selectedFiles);

  const finalPrompt = await refactorPromptTemplate.format({
    userRequest,
    projectFiles: compiledProjectFiles,
  });

  const nodes = {
    refactor: async (state) => {
      const response = await invokeClaude({ prompt: finalPrompt });
      const outputText = response.content?.[0]?.text || response;
      await parseAndSaveBatch(outputText);
      return { refactorResult: outputText };
    },
  };

  const graph = new StateGraph({ channels: graphState })
    .addNode("refactor", nodes.refactor)
    .setEntryPoint("refactor");

  const app = graph.compile();
  const result = await app.invoke({});
  return result.refactorResult;
};
