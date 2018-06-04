# How to contribute

The following is a set of guidelines for contributing to reSolve and its packages, which are hosted in the [Reimagined](https://github.com/reimagined) on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

#### Table Of Contents
* [Pull Requests](#pull-requests)
        * [Definition of the Done](#definition-of-the-done)
        * [Code Style](#code-style)
        * [Working in Monorepo](#working-in-monorepo)
* [Reporting Bugs](#reporting-bugs)
* [Issue Labels](#issue-labels)

## Pull Requests

Pull request is the main method to contribute `Resolve` repository. If you want to implement issue or fix code bug, read the bottom.

`reSolve` follows [Git flow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) branching model. The main development branch is `dev`. Branch `master` contains last stable release and hotfixes. `reSolve` repository is writeable only for maintainers, so to perform contribution - at first for own repository from `reSolve`.

### Naming

Create the new branch in the forked repository, name it `feature/FEATURE-name` for features, `hotfix/BUG-name` for hot-fixing bugs and `docs/DOC-name` for any documentation topics. If you maintaining several branches, don't forget to periodically merge with upstream `dev` branch.

### Definition of the Done

After implementing the feature or fixing the bug, ensure that Definition of the Done list had been passed:

* Your code is abided by [code-style conventions](#code-style), 
* Successfully passing ALL existing unit/functional tests. Before creating the pull request, ensure locally that following command had been executed successfully in monorepo root: `yarn prettier`, `yarn lint`, `yarn test` and `yarn test:functional`. 
* Working examples in the project.
* Fixes in the documentation if the supposed change affects it. 

You are free to choose how to check and cover new added code - unit or functional tests, additional examples to demo new features are welcome.

### Code Style

`reSolve` repository has code-style conventions and toolchain. Use `EcmaScript-262 version 8` for main source code, style it with [Prettier](https://github.com/prettier/prettier-eslint). Passing `eslint` with [repo configuration](https://github.com/reimagined/resolve/blob/master/.eslintrc.js) is enough. Take in mind that all files should end with a newline. Avoid platform-dependent code.

### Working in Monorepo

`Resolve` repository is **monorepo** - it contains source code, integration tests and examples for multiple `npm` packages, which commonly are used together and forms library or framework. Monorepo toolchain is consists of two concepts: [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [oao manager](https://www.npmjs.com/package/oao). 

Working with monorepo begins with the bootstrap process. In `resolve` repository, it's enough to execute command `yarn` in the monorepo root. All `npm` packages will be installed, and all repository-based packages will be linked to each other. So, you can develop features without pushing packages to `npm` (Or local equivalents, aka `sinopia` or `verdaccio`).

Take in mind two following aspects. Firstly, all `resolve-*` packages version should be identical due development. In another case, real npm version will be downloaded from the internet, instead of the local development package. Secondly, don't forget to re-bootstrap by `yarn` invocation, after bringing in changes into dependent `resolve-*` packages.

## Reporting Bugs and Feature request

Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports. When you are creating a bug report, please include as many details as possible. 

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). After you've determined [which package](../Packages) your bug is related to, create an issue on that repository and provide the full information.

Explain the problem and include additional details to help maintainers reproduce the problem:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible. 
* **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples. If you're providing snippets on the issue, use [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines).
* **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem. 
* **If the problem is related to performance or memory**, include a memory & CPU profile capture with your report.

Equivalent guidelines are applicable for Feature requests too.

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
| `Component: Documentation` | Issues related to package descriptions, docs folder topics, and README files |
| `Component: Examples` | Issues related to reSolve examples |
| `Component: readmodel-adapters` | Issues related to Read Model adapters packages |
| `Component: storage-adapters` | Issues related to storage adapters packages |
| `Component: resolve-auth` | Issues related to the resolve-auth package |
| `Component: resolve-es` | Issues related to the resolve-es package |
| `Component: resolve-query` | Issues related to the resolve-query package |
| `Component: resolve-redux` | Issues related to the resolve-redux package |
| `Component: resolve-scripts` | Issues related to the resolve-scripts package |

