import { parseAndSaveBatch, prepareClaudePayload, splitIntoChunks, sendToClaude } from "../utils/payloadUtils.js";
import { migrationPromptTemplate } from "../prompts/migrationPrompt.js";
 
/**
* Simplified migration flow that doesn't use LangGraph
* This direct implementation avoids the state management issues
*/
export const migrationFlow = async (selectedFiles, userRequest, targetLanguage) => {
  console.log(`Starting migration flow for ${selectedFiles.length} files`);
  // Prepare files and chunk them
  const compiledFiles = await prepareClaudePayload(selectedFiles);
  const chunkedFiles = await splitIntoChunks(compiledFiles, 6000);
  console.log(`Total chunks: ${chunkedFiles.length}`);
  // Track all responses
  const responses = [];
  // Process each chunk sequentially
  for (let i = 0; i < chunkedFiles.length; i++) {
    const chunk = chunkedFiles[i];
    const chunkIndex = i + 1;
    console.log(`Processing chunk ${chunkIndex}/${chunkedFiles.length}...`);
    try {
      // Format prompt for this chunk
      const prompt = await migrationPromptTemplate.format({
        targetLanguage,
        userRequest,
        projectFiles: chunk.map(f => `File: ${f.path}\nContent:\n${f.content}`).join('\n\n'),
      });
      // Send to Claude
      console.log(`Sending chunk ${chunkIndex} to Claude...`);
      const result = await sendToClaude(prompt);
      const responseText = result.text || result;
      console.log(`Response received for chunk ${chunkIndex} (${result.outputTokens} tokens)`);
      responses.push(responseText);
      // Parse and save files
      try {
        console.log(`Attempting to save files from chunk ${chunkIndex}...`);
        await parseAndSaveBatch(responseText);
      } catch (error) {
        console.error(`Error saving files from chunk ${chunkIndex}:`, error);
      }
      console.log(`Chunk ${chunkIndex}/${chunkedFiles.length} processed successfully`);
    } catch (error) {
      console.error(`Error processing chunk ${chunkIndex}:`, error);
      responses.push(`Error: ${error.message}`);
    }
  }
  console.log(`Migration complete. Processed ${chunkedFiles.length} chunks.`);
  return responses.join("\n\n");
};