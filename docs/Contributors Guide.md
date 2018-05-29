# Contributors Guide

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing to Resolve and its packages, which are hosted in the [Reimagined](https://github.com/reimagined) on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

#### Table Of Contents
* [Pull Requests](#pull-requests)
* [Reporting Bugs](#reporting-bugs)
* [Issue Labels](#issue-labels)

## Pull Requests

Pull request is the main method to contribute `Resolve` repository. If you want to implement issue or fix code bug, read the bottom.

`Resolve` follows [Git flow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) branching model. The main development branch is `dev`. Branch `master` contains last stable release and hotfixes. `Resolve` repository is writeable only for maintainers, so to perform contribution - at first for own repository from `resolve`.

Create the new branch in the forked repository, name it `feature/FEATURE-name` for features and `hotfix/BUG-name` for hot-fixing bugs. If you maintaining several branches, don't forget to periodically merge with upstream `dev` branch.

After implementing the feature or fixing the bug, ensure that Definition of the Done list had been passed. It includes code-style conventions, successfully passing ALL existing unit/functional tests and examples in the project, additions, and fixes in the documentation if the supposed change affects it. You are free to choose how to check and cover new added code - unit or functional tests, additional examples to demo new features are welcome.

`Resolve` repository has code-style conventions and toolchain. Use `EcmaScript-262 version 8` for main source code, style it with [Prettier](https://github.com/prettier/prettier-eslint). Passing `eslint` with [repo configuration](https://github.com/reimagined/resolve/blob/master/.eslintrc.js) is enough.

`Resolve` repository is **monorepo** - it contains source code, integration tests and examples for multiple `npm` packages, which commonly are used together and forms library or framework. Monorepo toolchain is consists of two concepts: [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [oao manager](https://www.npmjs.com/package/oao). 

Working with monorepo begins with the bootstrap process. In `resolve` repository, it's enough to execute command `yarn` in the monorepo root. All `npm` packages will be installed, and all repository-based packages will be linked to each other. So, you can develop features without pushing packages to `npm` (Or local equivalents, aka `sinopia` or `verdaccio`).

Take in mind two following aspects. Firstly, all `resolve-*` packages version should be identical due development. In another case, real npm version will be downloaded from the internet, instead of the local development package. Secondly, don't forget to re-bootstrap by `yarn` invocation, after bringing in changes into dependent `resolve-*` packages.

Before creating the pull request, ensure locally that following command had been executed successfully in monorepo root: `yarn prettier`, `yarn lint`, `yarn test` and `yarn test:functional`. 

Take in mind that all files should end with a newline. Avoid platform-dependent code.


## Reporting Bugs and Feature request

Following these guidelines helps maintainers and the community understand your report :pencil:, reproduce the behavior :computer: :computer:, and find related reports :mag_right:.  When you are creating a bug report, please include as many details as possible. 

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

### Issue Labels by severity

| Label name | Description |
| --- | --- |
| `Type: Bug` | Confirmed bugs or reports that are very likely to be bugs |
| `Type: Enhancement` | Feature requests |
| `Type: Documentation` | Issues about general documentation, readmes for packages, etc |
| `Type: Research & Discussion` | Fundamental architect discussion |

### Issue Labels by component

| Label name | Description |
| --- | --- |
| `Component: readmodel-adapters` | Adapters for read-model provides update and read interface, and bridge between `resolve` query side and custom database/storage implementations |
| `Component: resolve-es` | Event sourcing domain core - event store |
| `Component: resolve-redux` | Isomorphic `resolve` library for transparent view-models, identical for server and client |
| `Component: resolve-scripts` | Toolchain for local resolve applications development |

