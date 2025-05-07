// server.js
import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import { migrationFlow } from './flows/migrationFlow.js';
import { refactorFlow } from './flows/refactorFlow.js';
import { buildProjectFlow } from './flows/buildProjectFlow.js';
import { detectGoalFromPrompt, listFiles, prepareClaudePayload, sendToClaude } from './utils.js';
import { extractZip, cloneGitRepo } from './workspaceUtils.js';
import fs from 'fs';
import { testModels } from './utils/modelAccuracyTester.js';
import { generateCsv } from './utils/fileUtils.js';
import path from 'path';
import { runMigrationFlow } from './flows/migration/flowManager.js';
import { compareProjects } from './flows/accuracyChecker.js';

const app = express();
const PORT = 3002;
const WORKSPACE_DIR = './workspace';

app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

// Main Claude Prompt Handler
app.post('/api/send-prompt', async (req, res) => {
  try {
    const { selectedFiles = [], prompt = '' } = req.body;
    const detection = detectGoalFromPrompt(prompt);

    if (!detection) {
      return res.status(400).send('Unable to detect user goal.');
    }

    let response;

    switch (detection.goal) {
      case 'MIGRATE_PROJECT':
        response = await runMigrationFlow(selectedFiles, prompt, detection.targetLanguage);
        break;
      case 'REFACTOR_PROJECT':
        response = await refactorFlow(selectedFiles, prompt);
        break;
      case 'BUILD_NEW_PROJECT':
        response = await buildProjectFlow(prompt);
        break;
      default:
        return res.status(400).send('Unknown goal.');
    }

    res.json({ message: 'Success', response });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed.');
  }
});

// Upload ZIP
app.post('/api/upload-zip', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send('No file uploaded.');
    }
    const zipFile = req.files.file;
    const uploadPath = `${WORKSPACE_DIR}/${zipFile.name}`;
    await zipFile.mv(uploadPath);
    await extractZip(uploadPath, WORKSPACE_DIR);
    res.json({ message: 'ZIP extracted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to upload/extract.');
  }
});

// Import Git Repo
app.post('/api/import-git', async (req, res) => {
  try {
    const { gitUrl } = req.body;
    await cloneGitRepo(gitUrl, WORKSPACE_DIR);
    res.json({ message: 'Git repo cloned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to clone repo.');
  }
});

// List Files
app.get('/api/list-files', (req, res) => {
  try {
    const files = listFiles(WORKSPACE_DIR);
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to list files.');
  }
});

// Claude Prompt + Files (non-graph fallback)
app.post('/api/claude-simple', async (req, res) => {
  try {
    const { selectedFiles, prompt } = req.body;
    const finalPrompt = await prepareClaudePayload(selectedFiles, prompt);
    const claudeResponse = await sendToClaude(finalPrompt);
    res.json({ response: claudeResponse });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to send to Claude.');
  }
});

app.post('/api/test-models', async (req, res) => {
  try {
    const { prompt, expectedAnswer } = req.body;

    if (!prompt || !expectedAnswer) {
      return res.status(400).json({ error: "Missing prompt or expectedAnswer" });
    }

    const results = await testModels({ prompt, expectedAnswer });
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Model testing failed." });
  }
});

app.post('/api/export-model-report', async (req, res) => {
  try {
    const { prompt, expectedAnswer } = req.body;
    const results = await testModels({ prompt, expectedAnswer });
    const csv = generateCsv(results);

    const reportDir = path.resolve('./reports');

    // Ensure the ./reports directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const filePath = path.join(reportDir, 'model_accuracy.csv');
    await fs.promises.writeFile(filePath, csv);

    res.json({ message: 'CSV exported', path: filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

app.post('/api/compare-accuracy', async (req, res) => {
  try {
    const { originalDir = './workspace/whatsapp-api', migratedDir = './workspace/migrated-project' } = req.body;
    const results = await compareProjects(originalDir, migratedDir);
    res.json({ success: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to compare projects.' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
