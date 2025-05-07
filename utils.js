import fs from 'fs/promises';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import path from 'path';
import fsSync from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { splitLargeFileIntoChunks } from './utils/modelAccuracyTester.js';
import { splitLargePLSQLFileIntoChunks } from './utils/payloadUtils.js';

const allowedExtensions = [
  '.js', '.ts', '.tsx', '.jsx', '.java', '.json',
  '.html', '.css', '.vue', '.md', '.sql', '.txt', '.xml', '.yaml',
];
const client = new BedrockRuntimeClient({ region: "ap-south-1" });

// Recursively list all files
export const listFiles = (dir) => {
  let results = [];
  const list = fsSync.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fsSync.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(listFiles(file));
    } else {
      results.push(file);
    }
  });
  return results;
};
export const detectGoalFromPrompt = (userPrompt) => {
  const lowerPrompt = userPrompt.toLowerCase();

  if (lowerPrompt.includes('migrate')) {
    // Try to detect target language dynamically
    const targetLanguages = ['java', 'spring boot', 'python', 'flask', 'django', 'golang', 'go', 'node.js', 'typescript', 'kotlin', 'c#', 'dotnet', 'php', 'laravel'];

    for (const lang of targetLanguages) {
      if (lowerPrompt.includes(lang)) {
        return { goal: 'MIGRATE_PROJECT', targetLanguage: lang };
      }
    }
    // If migrate mentioned but no language, fallback
    return { goal: 'MIGRATE_PROJECT', targetLanguage: 'unknown' };
  } 
  
  else if (lowerPrompt.includes('refactor') || lowerPrompt.includes('optimize')) {
    return { goal: 'REFACTOR_PROJECT' };
  } 
  
  else if (lowerPrompt.includes('build') || lowerPrompt.includes('create')) {
    return { goal: 'BUILD_NEW_PROJECT' };
  } 
  
  else {
    return null;
  }
};

// Prepare the prompt for Claude
export const prepareClaudePayload = async (files, userPrompt, targetLanguage) => {
  const allChunks = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      console.warn(`⚠️ Skipping unsupported file: ${file}`);
      continue;
    }

    const content = await fs.readFile(file, 'utf-8');
    const relPath = path.relative('workspace', file);
    const tokenCount = countTokens(content);

    // If large SQL file, split into logical chunks
    if (ext === '.sql' && tokenCount > 80000) {
      console.warn(`⛔ Splitting oversized SQL file: ${file} (${tokenCount} tokens)`);
      const parts = await splitLargePLSQLFileIntoChunks(file, 30000);
      for (let i = 0; i < parts.length; i++) {
        allChunks.push({
          filename: `${relPath} (part ${i + 1})`,
          content: parts[i].content,
        });
      }
    } else {
      allChunks.push({
        filename: relPath,
        content,
      });
    }
  }

  // Combine formatted chunks into a prompt-safe string
  const projectFiles = allChunks
    .map(c => `File: ${c.filename}\nContent:\n${c.content}`)
    .join('\n\n');

  const finalPrompt = await migrationPromptTemplate.format({
    targetLanguage,
    userRequest: userPrompt,
    projectFiles,
  });

  return finalPrompt;
};

// Send the prompt to Claude via Bedrock
export const sendToClaude = async (inputPrompt) => {
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedro>ck-2023-05-31",
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

// parseAndSaveBatch.js
export const parseAndSaveBatch = async (batchText) => {
  const lines = batchText.split('\n');
  let currentFile = null;
  let currentContent = '';

  for (const line of lines) {
    if (line.startsWith('Filename:')) {
      if (currentFile) {
        // Save previous file
        const savePath = path.join('workspace', 'migrated-project', currentFile);
        await mkdir(path.dirname(savePath), { recursive: true });
        await writeFile(savePath, currentContent.trim(), 'utf-8');
      }
      currentFile = line.replace('Filename:', '').trim();
      currentContent = '';
    } else {
      currentContent += line + '\n';
    }
  }

  // Save last file
  if (currentFile) {
    const savePath = path.join('workspace', 'migrated-project', currentFile);
    await mkdir(path.dirname(savePath), { recursive: true });
    await writeFile(savePath, currentContent.trim(), 'utf-8');
  }
};
