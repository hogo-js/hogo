# Contributing to Hogo

Thank you for your interest in contributing to Hogo! We welcome contributions from everyone—whether you're fixing bugs, adding features, improving documentation, or helping with code review.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)
- [Style Guide](#style-guide)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). All community members are expected to create a welcoming and inclusive environment.

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn
- Basic Git knowledge

### Fork & Clone

1. Fork the [Hogo repository](https://github.com/hogo-js/hogo) on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/hogo-js/hogo
   cd hogo
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/hogo-js/hogo.git
   ```

## Development Setup


1. Run tests to verify your setup:
   ```bash
   npm run test:all
   ```

2. Run examples to familiarize yourself with the codebase:
   ```bash
   npm run example
   npm run example:advanced
   ```

## Making Changes

### Create a Branch

Always create a new branch for your changes. Use a descriptive name:

```bash
git checkout -b feature/atomic-coalescing-v2
git checkout -b fix/memory-leak-in-router
git checkout -b docs/improve-ship-api-docs
```

Branch naming conventions:
- `feature/` - New functionality
- `fix/` - Bug fixes
- `docs/` - Documentation improvements
- `test/` - Test additions or improvements
- `refactor/` - Code restructuring without changing behavior
- `perf/` - Performance improvements

### Work on Your Changes

- Make focused, logical commits
- Keep changes atomic (one idea per commit)
- Write tests for new functionality
- Update documentation if needed
- Ensure all tests pass locally

## Commit Messages

Write clear, descriptive commit messages:

### Format

```
<type>: <subject>

<body>

<footer>
```

### Rules

- **Limit the subject line to 50 characters**
- **Use the imperative mood** ("add feature" not "added feature")
- **Do not end the subject line with a period**
- **Separate subject from body with a blank line**
- **Wrap the body at 72 characters**
- **Use the body to explain *what* and *why*, not *how***

### Examples

```
feat: add timeout configuration for coalescing requests

Allow users to configure custom timeout values for request coalescing
to handle scenarios where operations take longer than the default.

Closes #123
```

```
fix: prevent memory leak in request tracker cleanup

The request tracker was not properly clearing references after request
completion, causing memory to accumulate under high load.

Fixes #456
```

```
docs: clarify Ship API response handling

Add examples for proper error handling and response shipping in the
documentation.
```

## Pull Request Process

### Before You Push

1. **Update your branch** with latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all tests** locally:
   ```bash
   npm run test:all
   ```

3. **Lint your code** (if applicable):
   ```bash
   npm run lint
   ```

### Opening a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin your-branch-name
   ```

2. Open a Pull Request on GitHub with:
   - **Clear title** describing the change
   - **Description** explaining the problem and solution
   - **References** to any related issues (e.g., "Fixes #123")
   - **Screenshots or examples** if applicable
   - **Checklist** of what you've done

### PR Description Template

```markdown
## Description
Brief explanation of what this PR does.

## Problem
What problem does this solve? Link to issues if applicable.

## Solution
How does this PR solve the problem?

## Testing
How was this tested? Include commands and results.

## Breaking Changes
Are there any breaking changes?

## Checklist
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Commits are clear and focused
```

### PR Reviews

- Respond constructively to feedback
- Make requested changes or discuss concerns
- Be patient—reviewers are volunteers
- Thank reviewers for their time

## Testing

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test suite
npm run test              # coalescing tests
npm run test:error       # error handling tests
npm run test:timeout     # timeout tests
```

### Writing Tests

- Tests should be focused and test one thing
- Use descriptive test names
- Place tests in the `tests/` directory
- Follow the naming convention: `feature.test.js`
- Test both success and failure paths

Example test:
```javascript
import { hogo } from '../src/index.js';

const app = hogo();

app.post('/api/user', async (ship) => {
  ship.send({ id: 1, name: 'Test User' });
});

// Test the endpoint...
```

## Documentation

- Keep README.md up to date
- Add JSDoc comments to public functions
- Update CHANGELOG.md for significant changes
- Write clear, concise explanations
- Include examples where helpful

### Documentation Updates

When adding new features:
1. Add JSDoc comments to functions
2. Update relevant markdown files
3. Include code examples
4. Update the API documentation
5. Note breaking changes clearly

## Reporting Issues

### Bug Reports

Include:
- Node.js version
- Hogo version
- Minimal reproducible example
- Expected behavior
- Actual behavior
- Error messages and stack traces

### Feature Requests

Include:
- Clear description of the requested feature
- Use cases and motivation
- Proposed API (if applicable)
- Potential alternatives
- Implementation concerns (if any)

## Style Guide

### Code Style

- **ES6+ modules** - Use `import`/`export` syntax
- **Async/await** - Prefer over `.then()` chains
- **Const/let** - Never use `var`
- **Semicolons** - Always include them
- **Quotes** - Use single quotes for strings
- **Line length** - Keep lines under 100 characters when reasonable
- **Comments** - Write meaningful comments, avoid obvious ones

### File Organization

```
src/
  index.js           # Main export
  hogo.js           # Core framework
  router.js         # Routing logic
  ship.js           # Response object
  request-tracker.js # Request tracking
  middleware/       # Middleware modules
    index.js
    antigravity.js
```

### Function Organization

1. Exports at the top
2. Constants
3. Helper functions
4. Main functions
5. Error handlers

### Naming Conventions

- **Classes**: PascalCase (`RequestTracker`)
- **Functions**: camelCase (`handleRequest`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TIMEOUT`)
- **Private functions**: Prefix with underscore (`_internalMethod`)

## Questions or Need Help?

- **GitHub Issues** - For bugs and feature requests
- **Discussions** - For questions and ideas
- **Email** - Reach out to maintainers directly

## License

By contributing to Hogo, you agree that your contributions will be licensed under the same MIT license that covers the project.

---

Thank you for contributing to Hogo! Your efforts help make the web faster and more efficient for everyone. 🚀
