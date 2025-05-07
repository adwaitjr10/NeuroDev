// /utils/payloadUtils.js
import fs from 'fs/promises';
import path from 'path';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { countTokens } from "@anthropic-ai/tokenizer";

const client = new BedrockRuntimeClient({ region: "ap-south-1" });

export const prepareClaudePayload = async (files) => {
  const fileContents = await Promise.all(
    files.map(async (file) => {
      const ext = path.extname(file).toLowerCase();
      if (!['.js', '.ts', '.tsx', '.jsx', '.java', '.json', '.html', '.css', '.vue', '.md', '.sql'].includes(ext)) {
        return null;
      }      

      const content = await fs.readFile(file, 'utf-8');
      return {
        path: path.relative('workspace', file),
        content
      };
    })
  );

  return fileContents.filter(Boolean);
};

export const parseAndSaveBatch = async (batchText) => {
  console.log("Starting to parse response from Claude...");
  
  // First try the "Filename:" pattern
  try {
    const lines = batchText.split('\n');
    let currentFile = null;
    let currentContent = '';
    let filesSaved = 0;

    for (const line of lines) {
      if (line.startsWith('Filename:')) {
        // Save previous file if exists
        if (currentFile) {
          const savePath = path.join('workspace', 'migrated-project', currentFile);
          await fs.mkdir(path.dirname(savePath), { recursive: true });
          await fs.writeFile(savePath, currentContent.trim(), 'utf-8');
          console.log(`Saved file: ${savePath}`);
          filesSaved++;
        }
        currentFile = line.replace('Filename:', '').trim();
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    }

    // Save the last file if exists
    if (currentFile) {
      const savePath = path.join('workspace', 'migrated-project', currentFile);
      await fs.mkdir(path.dirname(savePath), { recursive: true });
      await fs.writeFile(savePath, currentContent.trim(), 'utf-8');
      console.log(`Saved file: ${savePath}`);
      filesSaved++;
    }

    // If no files were found with "Filename:" pattern, try code block pattern
    if (filesSaved === 0) {
      console.log("No files found with 'Filename:' pattern, trying code block patterns...");
      await parseCodeBlocks(batchText);
    } else {
      console.log(`Total files saved: ${filesSaved}`);
      return filesSaved;
    }
  } catch (error) {
    console.error("Error in parseAndSaveBatch:", error);
    
    // Fallback to code block pattern if there was an error
    try {
      await parseCodeBlocks(batchText);
    } catch (fallbackError) {
      console.error("Failed in fallback parsing:", fallbackError);
      
      // Last resort: save the raw response for debugging
      await saveRawResponse(batchText);
    }
  }
};

// Helper function to parse code blocks with filenames
async function parseCodeBlocks(batchText) {
  let filesSaved = 0;
  
  // Try markdown code block pattern: ```language:filename.ext
  const codeBlockPattern = /```([\w\-+]+):([\w\-./]+)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockPattern.exec(batchText)) !== null) {
    const [_, language, filename, codeContent] = match;
    const savePath = path.join('workspace', 'migrated-project', filename);
    
    await fs.mkdir(path.dirname(savePath), { recursive: true });
    await fs.writeFile(savePath, codeContent.trim(), 'utf-8');
    console.log(`Saved file (code block): ${savePath} (${language})`);
    filesSaved++;
  }
  
  // Try alternative pattern: ## filename.ext ```language
  if (filesSaved === 0) {
    const altPattern = /## ([\w\-./]+)\s*```([\w\-+]*)\n([\s\S]*?)```/g;
    
    while ((match = altPattern.exec(batchText)) !== null) {
      const [_, filename, language, codeContent] = match;
      const savePath = path.join('workspace', 'migrated-project', filename);
      
      await fs.mkdir(path.dirname(savePath), { recursive: true });
      await fs.writeFile(savePath, codeContent.trim(), 'utf-8');
      console.log(`Saved file (alt pattern): ${savePath} (${language || 'unknown'})`);
      filesSaved++;
    }
  }
  
  if (filesSaved === 0) {
    console.log("No code blocks found. Saving raw response for inspection.");
    await saveRawResponse(batchText);
  } else {
    console.log(`Total files saved from code blocks: ${filesSaved}`);
  }
  
  return filesSaved;
}

// Helper function to save raw response for debugging
async function saveRawResponse(batchText) {
  const debugDir = path.join('workspace', 'migrated-project', '_debug');
  await fs.mkdir(debugDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const debugPath = path.join(debugDir, `claude_response_${timestamp}.txt`);
  
  await fs.writeFile(debugPath, batchText, 'utf-8');
  console.log(`Saved raw response for debugging: ${debugPath}`);
  return [debugPath];
}

export const sendToClaude = async (inputPrompt) => {
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: inputPrompt
        }
      ]
    }),
  });

  const response = await client.send(command);
  const json = JSON.parse(new TextDecoder().decode(response.body));

  return {
    text: json.content[0].text,
    inputTokens: json.usage.input_tokens,
    outputTokens: json.usage.output_tokens,
  };
};

export const splitIntoChunks = async (files, maxTokens = 80000) => {
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;

  for (const file of files) {
    const block = `File: ${file.path}\nContent:\n${file.content}`;
    const tokenCount = countTokens(block);

    // // Skip large single files that cannot fit alone
    // if (tokenCount > maxTokens) {
    //   console.warn(`File ${file.path} exceeds token limit alone (${tokenCount} tokens). Skipping...`);
    //   continue;
    // }

    // If current chunk would overflow, push it and start new
    if (currentTokens + tokenCount > maxTokens) {
      chunks.push([...currentChunk]);
      currentChunk = [];
      currentTokens = 0;
    }

    currentChunk.push({ path: file.path, content: file.content });
    currentTokens += tokenCount;
  }

  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks;
};

export const splitLargePLSQLFileIntoChunks = async (filePath, maxTokens = 30000) => {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  const chunks = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const line of lines) {
    const tokenCount = countTokens(line);
    
    // Logical boundary: if line starts new PL/SQL block
    const isBoundary = /^(CREATE|BEGIN|END|PROCEDURE|FUNCTION|PACKAGE|TRIGGER)/i.test(line.trim());

    if ((currentTokens + tokenCount > maxTokens) && isBoundary) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
      currentTokens = 0;
    }

    currentChunk += line + '\n';
    currentTokens += tokenCount;
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  return chunks.map((chunk, i) => ({
    path: `${filePath} (part ${i + 1})`,
    content: chunk,
  }));
};

// Simple convenience function that wraps sendToClaude - use if you're already using this function name
export const invokeClaude = sendToClaude;