// promptTemplates.js
export const PromptTemplates = {
    getMigrationPrompt: (targetLanguage) => `
  You are a highly skilled senior software engineer.
  
  Migrate the provided project to ${targetLanguage.toUpperCase()}.
  
  Requirements:
  - Set up correct project structure for ${targetLanguage}.
  - Convert existing logic properly — not just syntax, full rearchitecture if needed.
  - Create appropriate build files (pom.xml, package.json, go.mod, etc.).
  - Maintain modularity, best practices, and production quality.
  - Start each migrated file output with "Filename: <relative-path>".
  
  Deliver clean, production-grade code ready to run.
  `,
  
    REFACTOR_NODE_PROJECT: `
  You are a highly skilled senior software engineer.
  
  Refactor and optimize the provided project to production-grade quality.
  
  Requirements:
  - Improve code readability and maintainability.
  - Apply best coding practices.
  - Simplify complex or redundant logic.
  - Remove any dead code or unused variables.
  - Use modern programming constructs where appropriate.
  - Maintain original functionality without breaking behavior.
  - Update README.md if project structure changes.
  - Start each refactored file output with "Filename: <relative-path>".
  
  Deliver clean, professional, production-ready refactored code.
  `,
  
    BUILD_NEW_PROJECT: `
  You are a highly skilled senior software engineer.
  
  Create a fully functional project based on the user's request.
  
  Requirements:
  - Build the project in the specified programming language and framework.
  - Structure the project properly (src/main/java for Java, src/ for Node.js, etc.).
  - Create essential files like package.json, pom.xml, requirements.txt, etc.
  - Include a main application entry point (e.g., Application.java, app.js, app.py).
  - Add a basic README.md explaining how to build and run the project.
  - Keep the project minimal but fully functional.
  - Start each output file with "Filename: <relative-path>".
  
  Deliver a complete, production-quality starter project ready to run.
  `
  };
  
  