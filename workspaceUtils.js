import { exec } from 'child_process';
import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';

// Extract uploaded zip file
export const extractZip = async (zipPath, targetPath) => {
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: targetPath }))
    .promise();
  fs.unlinkSync(zipPath); // delete zip after extracting
};

// Clone a Git repo into workspace
export const cloneGitRepo = (gitUrl, targetPath) => {
  return new Promise((resolve, reject) => {
    exec(`git clone ${gitUrl}`, { cwd: targetPath }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
};
