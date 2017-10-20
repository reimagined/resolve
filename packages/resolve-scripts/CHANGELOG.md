# Change Log

All notable changes to this project will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.0.38"></a>
## [0.0.38](https://github.com/reimagined/resolve/compare/v0.0.27...v0.0.38) (2017-10-20)


### Bug Fixes

* add middlewares with empty params to create-resolve-app ([0ca16af](https://github.com/reimagined/resolve/commit/0ca16af)), closes [#279](https://github.com/reimagined/resolve/issues/279)
* display compile-time errors from server-side in dev mode ([41c41fc](https://github.com/reimagined/resolve/commit/41c41fc)), closes [#265](https://github.com/reimagined/resolve/issues/265)
* fix default config and error handling for graphql resolvers ([2bfd3c2](https://github.com/reimagined/resolve/commit/2bfd3c2))
* fix template ([d70aa12](https://github.com/reimagined/resolve/commit/d70aa12))
* fix templates issues ([f2b065a](https://github.com/reimagined/resolve/commit/f2b065a)), closes [#321](https://github.com/reimagined/resolve/issues/321) [#318](https://github.com/reimagined/resolve/issues/318) [#315](https://github.com/reimagined/resolve/issues/315)
* fix tests ([6984880](https://github.com/reimagined/resolve/commit/6984880))
* use server bundling without node_modules for socket.io  ([13e99ff](https://github.com/reimagined/resolve/commit/13e99ff))


### Features

* add graphql endpoint ([826bf48](https://github.com/reimagined/resolve/commit/826bf48))
* implement multiple read-models and better error handling ([aff2d5f](https://github.com/reimagined/resolve/commit/aff2d5f))
* provide jwt on client side ([1df756d](https://github.com/reimagined/resolve/commit/1df756d)), closes [#270](https://github.com/reimagined/resolve/issues/270)



### BREAKING CHANGES

* view models are available without graphql via get-request with appropriate view-model name in format `/api/query/${read_model_name}` with mandatory eventTypes and/or aggregateIds field for on-demand query
* read-models are provided in configuration by array instead of one element
* any read-model has own name, which used in query API in format `/api/query/${read_model_name}`
* rename all eventHandlers to projection, since it can be free-form entity, which is supported by selected read-model adapter



<a name="0.0.27"></a>
## [0.0.27](https://github.com/reimagined/resolve/compare/v0.0.26...v0.0.27) (2017-09-20)


### Bug Fixes

* use only npm for installation ([#269](https://github.com/reimagined/resolve/issues/269)) ([7397b81](https://github.com/reimagined/resolve/commit/7397b81)), closes [#211](https://github.com/reimagined/resolve/issues/211)


### Performance Improvements

* deleting unnecessary template files ([d01e562](https://github.com/reimagined/resolve/commit/d01e562)), closes [#200](https://github.com/reimagined/resolve/issues/200)




<a name="0.0.26"></a>
## [0.0.26](https://github.com/reimagined/resolve/compare/v0.0.25...v0.0.26) (2017-09-08)


### Bug Fixes

* **resolve-scripts:** static content serving in production mode from dist directory ([9582382](https://github.com/reimagined/resolve/commit/9582382))




<a name="0.0.25"></a>
## 0.0.25 (2017-09-08)


### Bug Fixes

* **resolve-scripts:** disable ssr in dev mode (#233) ([255ede1](https://github.com/reimagined/resolve/commit/255ede1))
