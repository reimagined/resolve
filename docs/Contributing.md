---
id: contributing
title: Contributing
description: This is a set of guidelines for contributing to reSolve and its packages hosted in the ReImagined project on GitHub.
---

# How to Contribute

This is a set of guidelines for contributing to reSolve and its packages hosted in the [ReImagined](https://github.com/reimagined) project on GitHub. These guidelines are designed to give you a general idea of our vision. Please do not treat them as strict rules you are obliged to follow, and feel free to propose changes to this document in a Pull Request.

**Table Of Contents**

- [Pull Requests](#pull-requests)
  - [Definition of the Done](#definition-of-the-done)
  - [Code Style](#code-style)
  - [Working in Monorepo](#working-in-monorepo)
- [Reporting Bugs and Requesting Features](#reporting-bugs-and-requesting-features)
- [Issue Labels](#issue-labels)

## Pull Requests

Pull Request is the primary method to contribute to the `ReSolve` repository. Use Pull Requests to implement an issue or fix a bug.

**reSolve** team follows the [Git Flow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) branching model. The main development branch is `dev`. The `master` branch contains the most recent stable release and hotfixes. The `reSolve` repository is writeable only for maintainers. Fork the repository, make the required changes, and [create a Pull Request](https://github.com/reimagined/resolve/compare) from your fork to the `dev` branch to change something. Although, if you feel that some other branch is better suited, free to create a Pull Request there.

### Naming Conventions

Create a new branch in the forked repository. Name it like this:

- `Feature/title` for features.
- `Hotfix/title` for bug fixes.
- `Docs/title` for any documentation topics.

If you are maintaining several branches, don't forget to merge the upstream `dev` branch into them periodically.

### Definition of the Done

After implementing a feature or fixing a bug, ensure that all items of the following list are satisfied:

- Your code abides by the [code-style conventions](#code-style).
- **All** existing unit and functional tests pass. Before creating a pull request, ensure that none of these commands show any error in your local environment: `yarn prettier`, `yarn lint`, `yarn test` and `yarn test:functional`.
- All examples work.
- The documentation is up to date (if applicable).

Unit tests, functional tests, and additional examples are highly appreciated.

### Code Style

Write JavaScript following the `ECMAScript-262 version 8` standard and use the [Prettier](https://github.com/prettier/prettier-eslint) tool. The `eslint` command should not show any errors with the [repo configuration](https://github.com/reimagined/resolve/blob/master/.eslintrc.js).

#### Tips:

- Line break is required at the end of all text files.
- Avoid platform-dependent code.

### Working in Monorepo

`ReSolve` repository is a **monorepo**: it contains source code, integration tests and examples for multiple `npm` packages commonly used together. Monorepo toolchain consists of two concepts: [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [oao manager](https://www.npmjs.com/package/oao).

The monorepo workflow begins with the bootstrapping process. In the `reSolve` repository, you should execute `yarn` command in the repository root. This command installs all `npm` packages and links all local packages to each other. With these tools, you can develop features without using `npm` (or local equivalents like `sinopia` or `verdaccio`).

#### Tips:

- All `resolve-*` packages versions should be identical. Otherwise, the missing npm package versions will be downloaded from the Internet, and local development packages will be ignored.
- Remember to re-bootstrap using `yarn` after making changes to the dependent `resolve-*` packages.

## Reporting Bugs and Requesting Features

Follow these guidelines to help maintainers and the community understand your report, reproduce the behavior, and find the related reports.

- When creating an issue, please include as many details as possible.

- Before creating an issue, search for the related issues and add links to all issues that seem relevant, even to Closed ones.

- Bugs and suggestions are tracked using [GitHub Issues](https://guides.github.com/features/issues/). After you've determined [which package](https://github.com/reimagined/resolve/tree/master/packages) your issue is related to, create an Issue and provide the complete description.

- Explain the problem and include additional details to help maintainers reproduce it:

  - **Use a clear and descriptive title** for an issue to identify the problem.
  - **Describe the exact steps to reproduce the problem** in detail.
  - **Provide examples**. Include links to files or GitHub projects, or add code snippets that demonstrate the problem. Use [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines) when providing code snippets.
  - **Include screenshots or screencast** to demonstrate the problem.
  - **If the problem is related to performance or memory**, include a memory and CPU profile capture.

## Issue Labels

### Issue Labels by Type

| Label name          | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `Type: Bug`         | Issues related to defects and incorrect/unexpected feature behavior |
| `Type: Enhancement` | Issues related to potential improvements and new features           |

### Issue Labels by Severity

| Label name           | Description                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `Severity: Minor`    | Issues with low impact on the product, e.g., small improvements or imperfections         |
| `Severity: Moderate` | Issues with medium impact on the product, e.g., new features, non-critical defects, etc. |
| `Severity: Major`    | Issues with high impact on the product, e.g., new packages, installation issues, etc.    |

### Issue Labels by Component

| Label name                       | Description                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Component: Documentation`       | Issues related to package descriptions, [docs folder topics](https://github.com/reimagined/resolve/tree/master/docs), and README files      |
| `Component: Core`                | Issues related to a core part of the framework, installation, etc.                                                                          |
| `Component: Examples`            | Issues related to [reSolve examples](https://github.com/reimagined/resolve/tree/master/examples)                                            |
| `Component: @resolve-js/redux`   | Issues related to the [@resolve-js/redux](https://github.com/reimagined/resolve/tree/master/packages/core/resolve-redux) package            |
| `Component: @resolve-js/scripts` | Issues related to the [@resolve-js/scripts](https://github.com/reimagined/resolve/tree/master/packages/core/resolve-scripts) package        |
| `Component: storage-adapters`    | Issues related to [storage adapters](https://github.com/reimagined/resolve/tree/master/packages/adapters/storage-adapters) packages         |
| `Component: readmodel-adapters`  | Issues related to [Read Model adapters](https://github.com/reimagined/resolve/tree/master/packages/adapters/readmodel-adapters) packages    |
| `Component: bus-adapters`        | Issues related to the [bus adapters](https://github.com/reimagined/resolve/tree/master/packages/adapters/bus-adapters) packages             |
| `Component: subscribe-adapters`  | Issues related to the [subscribe adapters](https://github.com/reimagined/resolve/tree/master/packages/adapters/subscribe-adapters) packages |
