# Changelog

## [Upcoming](https://github.com/reimagined/resolve/tree/HEAD)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.30.1...HEAD)

**New features:**

- Postgresql fixes and tests [\#1846](https://github.com/reimagined/resolve/pull/1846)

**Enhancements:**

- Update typescript to 4.2.4 [\#1847](https://github.com/reimagined/resolve/pull/1847)

**Bug fixes:**

- Environment variable is not updated after subsequent deploys [\#1833](https://github.com/reimagined/resolve/issues/1833)

**Documentation:**

- Add document descriptions [\#1841](https://github.com/reimagined/resolve/pull/1841)

## [V0.30.1](https://github.com/reimagined/resolve/tree/V0.30.1) (2021-04-29)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.30.0...V0.30.1)

**New features:**

- Eventstore replicator implemented as a read-model [\#1843](https://github.com/reimagined/resolve/pull/1843)

**Enhancements:**

- Normalize read-model Store API. Add functional tests. [\#1837](https://github.com/reimagined/resolve/pull/1837)

**Bug fixes:**

- Store.update\(\) with $inc operator works incorrectly [\#1794](https://github.com/reimagined/resolve/issues/1794)
- Store.update\(\) with $set operator works incorrectly in some cases [\#1782](https://github.com/reimagined/resolve/issues/1782)

**Documentation:**

- Revise API handler documentation [\#1832](https://github.com/reimagined/resolve/pull/1832)
- Update testing tools documentation [\#1831](https://github.com/reimagined/resolve/pull/1831)

## [V0.30.0](https://github.com/reimagined/resolve/tree/V0.30.0) (2021-04-28)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.29.0...V0.30.0)

**New features:**

- Automatic changelog generation [\#1835](https://github.com/reimagined/resolve/pull/1835)
- Performance monitoring [\#1829](https://github.com/reimagined/resolve/pull/1829)
- Advanced testing tools [\#1793](https://github.com/reimagined/resolve/pull/1793)

**Enhancements:**

- Monitoring improvements [\#1834](https://github.com/reimagined/resolve/pull/1834)
- Advanced testing tools: improvements [\#1816](https://github.com/reimagined/resolve/pull/1816)
- Improve cold start [\#1815](https://github.com/reimagined/resolve/pull/1815)
- Implement fast CTE for eventstore adapter [\#1800](https://github.com/reimagined/resolve/pull/1800)

**Bug fixes:**

- Unable to get read-models and sagas list using module-admin [\#1807](https://github.com/reimagined/resolve/issues/1807)
- Error collecting is broken in read model \(and saga\) projection [\#1797](https://github.com/reimagined/resolve/issues/1797)
-  with-angular example does not work [\#1795](https://github.com/reimagined/resolve/issues/1795)
- After local app launch, module-admin returns "invalid date" error for some time [\#1765](https://github.com/reimagined/resolve/issues/1765)
- The store.update function works incorrectly when the $set fields contain only null values. [\#1758](https://github.com/reimagined/resolve/issues/1758)

**Documentation:**

- Describe view model resolver configuration [\#1824](https://github.com/reimagined/resolve/pull/1824)
- Fix saga codesample [\#1821](https://github.com/reimagined/resolve/pull/1821)
- Describe encryption [\#1810](https://github.com/reimagined/resolve/pull/1810)
- Reference for adapters [\#1809](https://github.com/reimagined/resolve/pull/1809)
- Fix links to the PostgreSQL schema article [\#1796](https://github.com/reimagined/resolve/pull/1796)
- Update module-admin readme [\#1787](https://github.com/reimagined/resolve/pull/1787)
- Fix readme badges [\#1786](https://github.com/reimagined/resolve/pull/1786)

## V0.29.0

### Breaking Changes

#### Cloud config

- `deploymentId` and `encryptedDeploymentId` removed from **uploadAdapter** options

### Added

#### resolve runtime

- `clientIp` in request object

## V0.27.0

### Breaking Changes

#### Scoped packages

- reSolve packages are now published under the **@resolve-js** scope. You need to update reSolve package names in the dependecies and imports by replacing **'resolve-'** with **'@resolve-js/'**. For example, change **resolve-client** to **@resolve-js/client**.

#### Removed packages

- resolve-command
- resolve-query
- resolve-saga

#### Testing tools

- When querying read model resolvers from testing tools, the resolver results are returned unwrapped, the **data** property was removed.

#### Local config

- Removed the **eventBroker** section

#### Cloud config

- Runtime env RESOLVE_ES_SECRET_ARN renamed to RESOLVE_USER_SECRET_ARN
- Runtime env RESOLVE_ES_CLUSTER_ARN renamed to RESOLVE_EVENT_STORE_CLUSTER_ARN
- Runtime env RESOLVE_ES_DATABASE renamed to RESOLVE_EVENT_STORE_DATABASE_NAME
- Runtime env RESOLVE_READMODEL_SECRET_ARN renamed to RESOLVE_USER_SECRET_ARN
- Runtime env RESOLVE_ES_SECRET_ARN renamed to RESOLVE_USER_SECRET_ARN
- Runtime env RESOLVE_ES_EVENTS_TABLE removed
- Runtime env RESOLVE_ES_SECRETS_TABLE removed

### Added

#### Local config

- Added the **name** option. By default, it shares its value with the "name" field from package.json.

### Changed

#### Folder structure

- Packages folder structure has been changed. The **core** folder contains packages related to framework's core functionality. The **runtime** folder contains runtime-specific adapters, brokers etc. The **tools** folder contains basic scripts and testing tools.

#### @resolve-js/scripts

- Replaced the **reset** mode's **dropEventBus** option with **dropEventSubscriber**

Previously: 
```
await reset(resolveConfig, {
  dropEventStore: false,
  dropEventBus: true,
  dropReadModels: true,
  dropSagas: true,
})
```

Now:
```
await reset(resolveConfig, {
  dropEventStore: false,
  dropEventSubscriber: true,
  dropReadModels: true,
  dropSagas: true,
})
```

## V0.25.0

### Breaking Changes

#### resolve-client

- The **timestamp** query response field is now located in the meta object

#### resolve-react-hooks

- The **useViewModel** hook state callback is initially invoked with the state value of the view model's _Init_ handler and the second argument (`initial`) set to `true`. On further state changes, `initial` is set `false`.

#### resolve-redux

- All action types have been moved to internal namespace, avoid using them.
- The internal action structure has been drastically changed and further changes are to be expected. Avoid directly using this actions.
- Custom redux saga context has changed:
  - The **api** object has been removed and a **client** object (from the resolve-client package) has been added.
- React native support has been temporary suspended.

#### resolve-runtime

- **executeQuery** in API handlers now returns a **data** object containing view or read model data and a **meta** object containing query meta data

#### resolve-scripts

- **subscribeAdapter** option has been removed from config

#### Removed packages

- resolve-subscribe-mqtt
- resolve-subscribe-socket.io

### Added

- [Incremental import module](packages/modules/resolve-module-incremental-import/) (packages/modules/resolve-module-incremental-import/) provides out-of-the-box api-handlers that allow you to implement incremental import in any application..
- [Eventstore incremental import API](packages/runtime/adapters/eventstore-adapters/) (packages/adapters/eventstore-adapters/)
  - `beginIncrementalImport` - begin accumulate events for incremental import
  - `pushIncrementalImport` - accumulate events for incremental import
  - `commitIncrementalImport` - commit accumulated events to eventstore
  - `rollbackIncrementalImport` - drop accumulated events

- resolve-client
  - **meta** object in query response containing meta data

- resolve-redux
  - New redux hook API
  - Added **serializedState** parameter to createStore

### Changed

- resolve-client
  - **url** and **cursor** params in the **subscribe** function

### Removed


\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*
