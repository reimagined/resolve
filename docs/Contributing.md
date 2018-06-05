# How to Contribute

This is a set of guidelines for contributing to reSolve and its packages hosted in the [ReImagined](https://github.com/reimagined) project on GitHub. These guidelines are designed to give you a general idea of our vision, please do not consider them a strict rules and feel free to propose changes to this document in a Pull Request.

#### Table Of Contents

* [Pull Requests](#pull-requests)
    * [Definition of the Done](#definition-of-the-done)
    * [Code Style](#code-style)
    * [Working in Monorepo](#working-in-monorepo)
* [Reporting Bugs](#reporting-bugs)
* [Issue Labels](#issue-labels)

## Pull Requests

Pull Request is the main method to contribute to the `ReSolve` repository. Use Pull Requests to implement an issue or fix a bug.

**reSolve** team follows the [Git Flow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) branching model. The main development branch is `dev`. The `master` branch contains most recent stable release and hotfixes. The `reSolve` repository is writeable only for maintainers, so you should fork it make the required changes and [create a Pull Request](https://github.com/reimagined/resolve/compare) from your fork to the `dev` branch. Although, if you feel that some other branch suits better, feel free to create a Pull Request there.

### Naming Conventions

Create a new branch in the forked repository, name it like this:

* `Feature/title` for features.
* `Hotfix/title` for bug fixes.
* `Docs/title` for any documentation topics. 

If you are maintaining several branches, don't forget to periodically merge the upstream `dev` branch into them.

### Definition of the Done

After implementing a feature or fixing a bug, ensure that all items of the following list are satisfied:

* Your code is abided by the [code-style conventions](#code-style).
* **All** existing unit and functional tests are passing. Before creating a pull request, ensure that none of these commands show any error in your local environment: `yarn prettier`, `yarn lint`, `yarn test` and `yarn test:functional`.
* All examples work.
* The documentation is up to date (if applicable).

Unit tests, functional tests, and additional examples are highly appriciated.

### Code Style

Write JavaScript using the `EcmaScript-262 version 8` standard with the [Prettier](https://github.com/prettier/prettier-eslint) tool. The `eslint` command should not snow any errors with the [repo configuration](https://github.com/reimagined/resolve/blob/master/.eslintrc.js).

#### Tips:
* Line break is required in the end of all text files.
* Avoid platform-dependent code.

### Working in Monorepo

`ReSolve` repository is a **monorepo**: it contains source code, integration tests and examples for multiple `npm` packages commonly used together. Monorepo toolchain consists of two concepts: [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [oao manager](https://www.npmjs.com/package/oao). 

The monorepo workflow begins with the bootstraping process. In `reSolve` repository, you should execute `yarn` command in the repository root. All `npm` packages will be installed and all repository-based packages will be linked to each other. Thus, you can develop features without using `npm` (or local equivalents like `sinopia` or `verdaccio`).

#### Tips:

* All `resolve-*` packages versions should be identical. Otherwise, the missing npm package versions will be downloaded from the Internet and local development packages will be ignored. 
* Remember to re-bootstrap using `yarn` after making changes to the dependent `resolve-*` packages.

## Reporting Bugs and Requesting Features

Follow these guidelines to help maintainers and the community understand your report, reproduce the behavior, and find the related reports.

* When creating an issue, please include as many details as possible. 

* Before creating an issue, search for the related isues and add links to all issues that seems relevant even to the Closed ones.

* Bugs and suggestions are tracked using [GitHub Issues](https://guides.github.com/features/issues/). After you've determined [which package](../Packages) your issue is related to, create an Issue and provide the complete description.

* Explain the problem and include additional details to help maintainers reproduce it:

    * **Use a clear and descriptive title** for an issue to identify the problem.
    * **Describe the exact steps to reproduce the problem** in details. 
    * **Provide examples**. Include links to files or GitHub projects, or add code snippets that demonstrates the problem. Use [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines) when providing code snippets.
    * **Include screenshots or screencast** to demonstrate the problem. 
    * **If the problem is related to performance or memory**, include a memory and CPU profile capture.

## Issue Labels

### Issue Labels by Type

| Label name | Description |
| --- | --- |
| `Type: Bug` | Issues related to defects and incorrect/unexpected feature behavior |
| `Type: Enhancement` | Issues related to potential improvements and new features |

### Issue Labels by Severity

| Label name | Description |
| --- | --- |
| `Severity: Minor` | Issues with low impact on the product, e.g. small improvements or imperfections |
| `Severity: Moderate` | Issues with medium impact on the product, e.g. new features, non-critical defects, etc. |
| `Severity: Major` | Issues with high impact on the product, e.g. new packages, installation issues, etc. |

### Issue Labels by Component

| Label name | Description |
| --- | --- |
| `Component: Documentation` | Issues related to package descriptions, [docs folder topics](https://github.com/reimagined/resolve/tree/master/docs), and README files |
| `Component: Examples` | Issues related to [reSolve examples](https://github.com/reimagined/resolve/tree/master/examples) |
| `Component: readmodel-adapters` | Issues related to [Read Model adapters](https://github.com/reimagined/resolve/tree/master/packages/readmodel-adapters) packages |
| `Component: resolve-auth` | Issues related to the [resolve-auth](https://github.com/reimagined/resolve/tree/master/packages/resolve-auth) package |
| `Component: resolve-es` | Issues related to the [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es) package |
| `Component: resolve-query` | Issues related to the [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query) package |
| `Component: resolve-redux` | Issues related to the [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux) package |
| `Component: resolve-scripts` | Issues related to the [resolve-scripts](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts) package |

