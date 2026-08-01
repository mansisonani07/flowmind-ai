# Contributing to FlowMind AI

First off, thank you for considering contributing to FlowMind AI! 🎉

## Welcome

FlowMind AI is an open-source WhatsApp AI assistant that helps small businesses automate customer queries using RAG (Retrieval-Augmented Generation). Your contributions — whether fixing a bug, adding a feature, improving documentation, or reporting an issue — make the project better for everyone.

## How to Report Bugs

If you find a bug, please open a [GitHub Issue](https://github.com/your-repo/flowmind-ai/issues) with the following details:

1. **Title**: A clear, descriptive summary of the bug
2. **Steps to Reproduce**: Numbered steps so we can reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, Python version, Node.js version, browser (if applicable)
6. **Screenshots/Logs**: Any relevant error messages or screenshots

## How to Suggest Features

Feature requests are welcome! Please open a GitHub Issue with:

- A clear description of the proposed feature
- The motivation or use case behind it
- Any examples or references to similar implementations

## Pull Request Process

1. **Fork** the repository to your GitHub account
2. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```
3. **Make your changes** following the code style guidelines below
4. **Write tests** for any new functionality (see Testing Requirements)
5. **Commit** your changes using [Conventional Commits](#commit-messages)
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** against the `main` branch with a clear description of changes
8. Address any review feedback before the PR is merged

## Code Style

### Python (Backend)

- Follow [PEP 8](https://peps.python.org/pep-0008/) style guidelines
- Use type hints for all function signatures and variables
- Format code with `black` (line length 88)
- Lint with `ruff` or `flake8`
- Sort imports with `isort`
- Write docstrings in Google style format:
  ```python
  def process_document(file_path: str) -> list[str]:
      """Process a PDF document and extract text chunks.

      Args:
          file_path: Path to the PDF file to process.

      Returns:
          A list of text chunks extracted from the document.

      Raises:
          FileNotFoundError: If the file does not exist.
      """
  ```

### TypeScript / React (Frontend)

- Follow the existing ESLint and Prettier configuration
- Use TypeScript strict mode — no `any` types unless absolutely necessary
- Prefer functional components with hooks
- Use descriptive variable and function names
- Format with Prettier (default settings)

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) to keep the commit history readable and enable automatic changelog generation.

Format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, missing semi-colons) |
| `refactor` | Code refactoring without behavior changes |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, or tooling changes |
| `ci` | CI/CD configuration changes |
| `perf` | Performance improvements |

**Examples:**

```
feat(backend): add batch document upload endpoint
fix(frontend): resolve sidebar collapse animation glitch
docs: update API documentation with new query endpoint
test(backend): add integration tests for RAG engine
```

## Testing Requirements

### Backend (Python)

- All new features must include unit tests
- Tests live in the `backend/tests/` directory
- Name test files `test_*.py` and test functions `test_*`
- Use `pytest` with `pytest-asyncio` for async tests
- Run the full suite before submitting a PR:
  ```bash
  cd backend
  pytest -v
  ```

### Frontend (TypeScript)

- Component tests should cover rendering, user interactions, and edge cases
- Run the build to check for TypeScript errors:
  ```bash
  cd frontend
  npm run build
  ```

## Code of Conduct

- Be respectful and inclusive in all interactions
- Welcome newcomers and help them get started
- Provide constructive, specific feedback during code reviews
- Focus on what is best for the community and the project
- Keep discussions on-topic and professional

Thank you for contributing to FlowMind AI! 💜
