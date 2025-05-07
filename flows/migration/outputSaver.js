// migration/outputSaver.js

import fs from "fs/promises";
import path from "path";

export const saveClaudeOutput = async (text, chunkIndex) => {
  console.log("\nSaving Claude output for chunk " + chunkIndex);
  const lines = text.split("\n");

  let currentFile = null;
  let currentContent = [];
  let savedFiles = 0;

  for (const line of lines) {
    if (line.startsWith("Filename:")) {
      if (currentFile && isValidFilename(currentFile)) {
        await trySaveFile(currentFile, currentContent.join("\n"));
        savedFiles++;
      }

      currentFile = line.replace("Filename:", "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentFile && isValidFilename(currentFile)) {
    await trySaveFile(currentFile, currentContent.join("\n"));
    savedFiles++;
  }

  if (savedFiles === 0) {
    console.warn("No valid files found. Saving raw Claude output...");
    await saveFallbackOutput(text, chunkIndex);
  } else {
    console.log(`Files saved from chunk ${chunkIndex}: ${savedFiles}`);
  }
};

function isValidFilename(filename) {
  // Block writing if filename is empty, a directory, or lacks a proper file name
  return filename && path.basename(filename) && !filename.endsWith("/");
}

async function trySaveFile(filename, content) {
  try {
    const fullPath = path.join("workspace", "migrated-project", filename);
    const stat = await fs.stat(fullPath).catch(() => null);

    if (stat?.isDirectory()) {
      console.warn(`Skipping write: path is a directory - ${filename}`);
      return;
    }

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content.trim(), "utf-8");
    console.log(`Saved: ${fullPath}`);
  } catch (err) {
    console.error(`Failed to save file: ${filename} - ${err.message}`);
  }
}

async function saveFallbackOutput(text, chunkIndex) {
  const fallbackPath = path.join(
    "workspace",
    "migrated-project",
    "_debug",
    `chunk_${chunkIndex}_response.txt`
  );
  await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
  await fs.writeFile(fallbackPath, text, "utf-8");
  console.log(`Raw fallback saved: ${fallbackPath}`);
}
