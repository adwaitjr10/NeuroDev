import { PromptTemplate } from "@langchain/core/prompts";

export const refactorPromptTemplate = new PromptTemplate({
  template: `
You are a highly skilled senior software engineer.

Refactor and optimize the provided project to production-grade quality.

Requirements:
- Improve code readability, maintainability, and performance.
- Apply best modern coding practices.
- Simplify redundant or complex logic.
- Remove dead code, unused variables, and unnecessary dependencies.
- Use modern programming constructs (async/await, destructuring, arrow functions, etc.).
- Maintain original functionality without breaking behavior.
- Update project dependencies if necessary (e.g., upgrade outdated npm packages).
- Update README.md if project structure changes.
- Start each refactored file output with "Filename: <relative-path>".

User Request:
{userRequest}

Project Files:
{projectFiles}

Deliver clean, production-ready code.
`,
  inputVariables: ["userRequest", "projectFiles"],
});
