# Contributing to BlockWarriors

This guide outlines the contribution workflow for the BlockWarriors project.

## Contribution Workflow

### 1. Work in a Feature Branch

- Every contributor works out of their own branch.
- Follow the branch naming convention: `{first name initial}{lastname}-{feature}`
  - Examples:
    - `jdoe-login-page`
    - `asmith-bugfix123`
    - `mjones-update-readme`

### 2. Update Your Branch Regularly

- Keep your branch up to date with the main branch by regularly pulling the latest changes.
  ```bash
  git pull origin main
  ```

### 3. Commit Frequently and Meaningfully

- Write clear and descriptive commit messages.
  - Good: `Fix null pointer exception in login handler`
  - Bad: `Fixed stuff`

### 4. Run Tests

- Ensure that your changes do not break the build by running all relevant tests locally.

### 5. Create a Pull Request (PR)

- Once your feature or fix is complete, create a pull request to merge your branch into the main branch.
- Include a clear title and description for the PR:
  - Title: `Add login page functionality`
  - Description: "This PR includes the implementation of the login page, user authentication logic, and relevant unit tests."
- Assign a reviewer to your PR.

### 6. Code Review

- Reviewers will provide feedback and request changes if necessary.
- Address all comments and suggestions before requesting another review.

### 7. Merge to Main

- Once the PR is approved, squash and merge your branch into main.
  - Ensure there are no merge conflicts.
  ```bash
  git checkout main
  git pull origin main
  git merge --squash your-branch
  git push origin main
  ```
- Delete your branch after merging.

## Code Style

- Follow the existing code style patterns in the repository
- For JavaScript/TypeScript code:
  - Use ESLint and Prettier with the project configurations
  - Use TypeScript types appropriately
- For components:
  - Follow the established component structure
  - Use Tailwind CSS for styling

## Commit Message Guidelines

Commit messages should be clear and descriptive, following this format:
```
<type>: <subject>

<body>
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, missing semi-colons, etc)
- refactor: Code changes that neither fix a bug nor add a feature
- perf: Performance improvements
- test: Adding or fixing tests
- chore: Changes to the build process or auxiliary tools

## Questions?

If you have any questions about contributing, please reach out to the project maintainers.
