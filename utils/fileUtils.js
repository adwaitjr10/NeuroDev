// /utils/fileUtils.js
import { exec } from 'child_process';
import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';

export const extractZip = async (zipPath, targetPath) => {
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: targetPath }))
    .promise();
  fs.unlinkSync(zipPath); // delete zip after extracting
};

export const cloneGitRepo = (gitUrl, targetPath) => {
  return new Promise((resolve, reject) => {
    exec(`git clone ${gitUrl}`, { cwd: targetPath }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
};

export const listFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(listFiles(file));
    } else {
      results.push(file);
    }
  });
  return results;
};

export const generateCsv = (results) => {
  const headers = "Model,ModelId,Score,Output\n";
  const rows = results.map(({ name, modelId, score, output }) =>
    `"${name}","${modelId}",${score},"${(output || "").replace(/"/g, '""')}"`
  );
  return headers + rows.join("\n");
};