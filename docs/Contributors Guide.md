# Contributors Guide

-------------------------------------------------------------------------
Sorry, this article isn't finished yet :(
    
We'll glad to see all your questions:
* [**GitHub Issues**](https://github.com/reimagined/resolve/issues)
* [**Twitter**](https://twitter.com/resolvejs)
* e-mail to **reimagined@devexpress.com**
-------------------------------------------------------------------------

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing to Resolve and its packages, which are hosted in the [Reimagined](https://github.com/reimagined) on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

#### Table Of Contents
* [Reporting Bugs](#reporting-bugs)
* [Pull Requests](#pull-requests)
* [Styleguides](#styleguides)
* [Issue Labels](#issue-labels)


## Reporting Bugs and Feature request

Following these guidelines helps maintainers and the community understand your report :pencil:, reproduce the behavior :computer: :computer:, and find related reports :mag_right:.  When you are creating a bug report, please include as many details as possible. 

> **Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). After you've determined [which package](../Packages) your bug is related to, create an issue on that repository and provide the full information.

Explain the problem and include additional details to help maintainers reproduce the problem:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible. 
* **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples. If you're providing snippets in the issue, use [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines).
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem. 
* **If the problem is related to performance or memory**, include a memory & CPU profile capture with your report.
* **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened and share more information using the guidelines below.

Equalent guidelines are applicable for Feature requests too.


## Pull Requests

* Fork `Resolve` repository, implement feature or fix bug, then create pull request to original repository.
* `Resolve` follows [Git flow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) branching model, so name your branch as `feature/FEATURE-name` for features and `hotfix/BUG-name` for hotfixing bugs.
* Include screenshots and animated GIFs in your pull request whenever possible.
* Use `EcmaScript-262 version 8` for main source code, style it with [Prettier](https://github.com/prettier/prettier-eslint).
* Document new code based on the existing Documentation style
* End all files with a newline
* Avoid platform-dependent code


## Issue Labels

### Issue Labels by severity

| Label name | Description |
| --- | --- | --- | --- |
| `Type: Bug` | Confirmed bugs or reports that are very likely to be bugs |
| `Type: Enhancement` | Feature requests |
| `Type: Documentation` | Issues about general documentation, readmes for packages, etc |
| `Type: Research & Discussion` | Fundamental architect discussion |

### Issue Labels by component

| Label name | Description |
| --- | --- | --- | --- |
| `Component: readmodel-adapters` |  |
| `Component: resolve-es` |  |
| `Component: resolve-redux` |  |
| `Component: resolve-scripts` |  |
