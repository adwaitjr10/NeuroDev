import { PromptTemplate } from "@langchain/core/prompts";

export const buildPromptTemplate = new PromptTemplate({
  template: `
You are a highly skilled senior software engineer.

Create a fully functional, minimal but production-ready starter project based on the user's request.

Requirements:
- Build the project in the specified programming language and framework.
- Set up correct folder structure (e.g., src/main/java for Java, src/ for Node.js, etc.).
- Include essential files like package.json, pom.xml, requirements.txt, etc.
- Create a main application entry point (e.g., Application.java, app.js, app.py).
- Add a README.md explaining how to build, run, and test the project.
- Mock database or API layers if needed with simple in-memory structures.
- Use environment variables for configurations (if necessary).
- Start each generated file output with "Filename: <relative-path>".

User Request:
{userRequest}

Deliver a complete, working starter project.
`,
  inputVariables: ["userRequest"],
});
