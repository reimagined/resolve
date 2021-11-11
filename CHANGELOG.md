# Changelog

## [Upcoming](https://github.com/reimagined/resolve/tree/HEAD)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.33.1...HEAD)

**Bug fixes:**

- Some format options does not work in cli, for example domainName [\#2110](https://github.com/reimagined/resolve/issues/2110)
- Custom read-model does not start [\#2095](https://github.com/reimagined/resolve/issues/2095)
- Babel "loose mode" warnings  [\#2011](https://github.com/reimagined/resolve/issues/2011)

## [V0.33.1](https://github.com/reimagined/resolve/tree/V0.33.1) (2021-11-09)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.33.0...V0.33.1)

**Bug fixes:**

- "Pool is null" error in sagas [\#2101](https://github.com/reimagined/resolve/issues/2101)
- The IsAlive flag for read models is false although read model is live \(no any errors\) [\#2092](https://github.com/reimagined/resolve/issues/2092)
- Read-model doesn't handle events newly added to projection [\#2052](https://github.com/reimagined/resolve/issues/2052)
- Unable to create app using Node v14 due to sqlite3 installation error [\#1998](https://github.com/reimagined/resolve/issues/1998)

**Documentation:**

- Describe the emulateWorkerLifetimeLimit option [\#2100](https://github.com/reimagined/resolve/pull/2100)

**Other changes:**

- Improve already dispose error handling for all disposable resolve resoures, inclusing read-model adapters [\#2103](https://github.com/reimagined/resolve/pull/2103)

## [V0.33.0](https://github.com/reimagined/resolve/tree/V0.33.0) (2021-10-27)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.32.0...V0.33.0)

**New features:**

- Implement monitoring adapters [\#2089](https://github.com/reimagined/resolve/pull/2089)
- Add event loader in eventstore adapter inferface and loading events via pg-cursor [\#2067](https://github.com/reimagined/resolve/pull/2067)

**Enhancements:**

- Make less database queries during replication [\#2084](https://github.com/reimagined/resolve/pull/2084)
- Use event-loader \(via pgcursor for postgres\) in replicator [\#2076](https://github.com/reimagined/resolve/pull/2076)

**Breaking changes:**

- Remove RDS data api eventstore and readmodel adapters [\#2078](https://github.com/reimagined/resolve/pull/2078)
- Refactored runtime libraries [\#2060](https://github.com/reimagined/resolve/pull/2060)

**Bug fixes:**

- Testing tools - When passing events with timestamps to givenEvents\(\), these events are sometimes lost [\#2075](https://github.com/reimagined/resolve/issues/2075)

**Documentation:**

- Fix outdated content in the Preparing to Production topic [\#2086](https://github.com/reimagined/resolve/pull/2086)
- Remove postgres-serverless adapters mentions from documentation [\#2083](https://github.com/reimagined/resolve/pull/2083)

**Other changes:**

- Ability to delay next in readmodel build [\#2090](https://github.com/reimagined/resolve/pull/2090)
- Fix subscriber notification [\#2062](https://github.com/reimagined/resolve/pull/2062)
- Migrate from "incremental import" to "import" [\#2061](https://github.com/reimagined/resolve/pull/2061)
- Review strings in templates and examples [\#2059](https://github.com/reimagined/resolve/pull/2059)
- Cleanup eventstore tests [\#2058](https://github.com/reimagined/resolve/pull/2058)

## [V0.32.0](https://github.com/reimagined/resolve/tree/V0.32.0) (2021-10-01)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.31.10...V0.32.0)

**New features:**

- Resolve gate [\#2040](https://github.com/reimagined/resolve/pull/2040)

**Enhancements:**

- Add an option to specify hostname for running app in dev mode [\#2024](https://github.com/reimagined/resolve/issues/2024)

**Breaking changes:**

- Update minimal node version to 14 [\#2034](https://github.com/reimagined/resolve/pull/2034)

**Bug fixes:**

- Timestamps from CommandResult and Event are different [\#1994](https://github.com/reimagined/resolve/issues/1994)
- The Replicator read model takes a lot of resources during replication of big event store \(5kk events\) [\#1949](https://github.com/reimagined/resolve/issues/1949)

**Documentation:**

- Describe the `host` option [\#2043](https://github.com/reimagined/resolve/pull/2043)
- Describe API for fundamental entities of reSolve [\#2032](https://github.com/reimagined/resolve/pull/2032)

**Other changes:**

- Next step on long builds [\#2056](https://github.com/reimagined/resolve/pull/2056)
- Bump resolve-cloud-common version [\#2054](https://github.com/reimagined/resolve/pull/2054)
- Update invocation type for send notifications [\#2053](https://github.com/reimagined/resolve/pull/2053)

## [V0.31.10](https://github.com/reimagined/resolve/tree/V0.31.10) (2021-09-08)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.31.9...V0.31.10)

**Enhancements:**

- Speedup events export and export tests [\#2031](https://github.com/reimagined/resolve/pull/2031)
- Replace sqlite3 with better-sqlite3 [\#2027](https://github.com/reimagined/resolve/pull/2027)

**Bug fixes:**

- Redeploy existing application automatically resume manually paused read model [\#1951](https://github.com/reimagined/resolve/issues/1951)

**Documentation:**

- Describe middleware [\#2004](https://github.com/reimagined/resolve/pull/2004)
- Describe the store.find projection argument [\#2001](https://github.com/reimagined/resolve/pull/2001)

**Other changes:**

- Separate error type for 'too many clients' postgres error [\#2033](https://github.com/reimagined/resolve/pull/2033)
- Sparse clean TRX journal / Improve PLV8 [\#2030](https://github.com/reimagined/resolve/pull/2030)

## [V0.31.9](https://github.com/reimagined/resolve/tree/V0.31.9) (2021-08-31)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.31.8...V0.31.9)

**Bug fixes:**

- Events with same timestamp being projected/exported in wrong order  [\#1948](https://github.com/reimagined/resolve/issues/1948)

**Other changes:**

- Add latest cursor in description of event-store adapter [\#2017](https://github.com/reimagined/resolve/pull/2017)
- Improve local registry URLS behaviour in resolve-scripts [\#2015](https://github.com/reimagined/resolve/pull/2015)

## [V0.31.5](https://github.com/reimagined/resolve/tree/V0.31.5) (2021-07-29)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.31.4...V0.31.5)

**New features:**

- Add 'describe' method for eventstore adapater [\#1972](https://github.com/reimagined/resolve/pull/1972)

**Enhancements:**

- Commands return created event to client [\#1876](https://github.com/reimagined/resolve/issues/1876)
- Introduce an option for aggregate config that enables or disables returning resulting event to client on command execution.  [\#1963](https://github.com/reimagined/resolve/pull/1963)

**Bug fixes:**

- Running create-resolve-app on Windows results in incorrect path error [\#1964](https://github.com/reimagined/resolve/issues/1964)
- Unable to use `withEncryption` and `withAdapter` API simultaneously [\#1959](https://github.com/reimagined/resolve/issues/1959)

**Other changes:**

- Soft bootstrap \(primitive without mutexes for concurrent bootstrap/shutdown\) [\#1971](https://github.com/reimagined/resolve/pull/1971)

## [V0.31.4](https://github.com/reimagined/resolve/tree/V0.31.4) (2021-07-19)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.31.3...V0.31.4)

**Enhancements:**

- Passthorugh errors list from monitoring [\#1957](https://github.com/reimagined/resolve/pull/1957)
- Implement toggle notification queue mode [\#1950](https://github.com/reimagined/resolve/pull/1950)
- Add injectEvents, run import-export tests on postgres too [\#1947](https://github.com/reimagined/resolve/pull/1947)

**Bug fixes:**

- Failed to load events in eventstore adapter if connection is terminated while events loading [\#1901](https://github.com/reimagined/resolve/issues/1901)
- Events batch load is very slow [\#1875](https://github.com/reimagined/resolve/issues/1875)

**Other changes:**

- Add more monitoring functional tests [\#1941](https://github.com/reimagined/resolve/pull/1941)

## [V0.31.3](https://github.com/reimagined/resolve/tree/V0.31.3) (2021-07-12)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.31.2...V0.31.3)

**Enhancements:**

- Improve passthrough errors [\#1944](https://github.com/reimagined/resolve/pull/1944)

**Bug fixes:**

- RESOLVE\_DEPLOYMENT\_DOMAIN is incorrect after using the `domains assign` command [\#1933](https://github.com/reimagined/resolve/issues/1933)
- Command error: Incorrect order of events by aggregateId [\#1873](https://github.com/reimagined/resolve/issues/1873)

**Other changes:**

- Handle connection terminated errors in postgres eventstore adapter [\#1943](https://github.com/reimagined/resolve/pull/1943)

## [V0.31.2](https://github.com/reimagined/resolve/tree/V0.31.2) (2021-07-08)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.31.1...V0.31.2)

**New features:**

- Middleware support for aggregate commands, read model resolvers and projections [\#1925](https://github.com/reimagined/resolve/pull/1925)

**Enhancements:**

- Enhance event subscriber prefixes [\#1936](https://github.com/reimagined/resolve/pull/1936)
- Implement monitoring execution counter [\#1932](https://github.com/reimagined/resolve/pull/1932)
- Implement only one-time event source mapping [\#1929](https://github.com/reimagined/resolve/pull/1929)
- Collect read model building metrics per event [\#1927](https://github.com/reimagined/resolve/pull/1927)

**Bug fixes:**

- Pagination problem with hacker-news example [\#1928](https://github.com/reimagined/resolve/issues/1928)
- UI problems with hacker-news example [\#1921](https://github.com/reimagined/resolve/issues/1921)

**Documentation:**

- Migrate documentation to docusaurus v2 [\#1924](https://github.com/reimagined/resolve/pull/1924)

## [V0.31.1](https://github.com/reimagined/resolve/tree/V0.31.1) (2021-07-01)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.31.0...V0.31.1)

**Enhancements:**

- Improve event source mapping \(wait for enabled/disabled state\) [\#1922](https://github.com/reimagined/resolve/pull/1922)

**Documentation:**

- Restructure the documentation to account for moved examples [\#1918](https://github.com/reimagined/resolve/pull/1918)

## [V0.31.0](https://github.com/reimagined/resolve/tree/V0.31.0) (2021-06-28)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.30.5...V0.31.0)

**New features:**

- Add SQS integration [\#1905](https://github.com/reimagined/resolve/pull/1905)
- Upgrade examples [\#1902](https://github.com/reimagined/resolve/pull/1902)

**Enhancements:**

- Don't create new instance of postgres connection per each query [\#1909](https://github.com/reimagined/resolve/pull/1909)

**Bug fixes:**

- The loadEvents function does not work if 'startTime' and 'endTime' parameters are specified [\#1903](https://github.com/reimagined/resolve/issues/1903)

**Other changes:**

- Fix getCursorUntilEventTypes [\#1913](https://github.com/reimagined/resolve/pull/1913)
- Feature/hot read models [\#1910](https://github.com/reimagined/resolve/pull/1910)
- Examples and create-resolve-app minor fixes [\#1907](https://github.com/reimagined/resolve/pull/1907)

## [V0.30.5](https://github.com/reimagined/resolve/tree/V0.30.5) (2021-06-08)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.30.4...V0.30.5)

**New features:**

- Implement inline projection execution in RDBMS PostgreSQL via PLV8 extenstion [\#1898](https://github.com/reimagined/resolve/pull/1898)

**Bug fixes:**

- SQLITE\_ERROR: cannot start a transaction within a transaction [\#1886](https://github.com/reimagined/resolve/issues/1886)
- Event subscription does not work for cursor equal to null [\#1884](https://github.com/reimagined/resolve/issues/1884)
- Event store postgresql serverless failed on loading events with empty types list [\#1883](https://github.com/reimagined/resolve/issues/1883)
- View model gets duplicated events through websocket [\#1877](https://github.com/reimagined/resolve/issues/1877)
- Subscription to events with a custom view-model resolver [\#1874](https://github.com/reimagined/resolve/issues/1874)

**Other changes:**

- Add postresql integration tests into CI [\#1897](https://github.com/reimagined/resolve/pull/1897)
- Implement monitoring in readmodel-postgresql [\#1896](https://github.com/reimagined/resolve/pull/1896)
- Improve dev pr workflow [\#1893](https://github.com/reimagined/resolve/pull/1893)
- saveEvent returns a saved event with the next cursor [\#1879](https://github.com/reimagined/resolve/pull/1879)

## [V0.30.4](https://github.com/reimagined/resolve/tree/V0.30.4) (2021-05-27)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.30.3...V0.30.4)

**New features:**

- Eventstore adapter: saveEvent now returns the next cursor, add getCursorUntilEventTypes [\#1878](https://github.com/reimagined/resolve/pull/1878)

**Bug fixes:**

- Read models don't work in cloud [\#1880](https://github.com/reimagined/resolve/issues/1880)
- Can't pass timestamp to givenEvents events [\#1862](https://github.com/reimagined/resolve/issues/1862)

## [V0.30.3](https://github.com/reimagined/resolve/tree/V0.30.3) (2021-05-17)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.30.2...V0.30.3)

**Enhancements:**

- Update eslint [\#1858](https://github.com/reimagined/resolve/pull/1858)

**Bug fixes:**

- Wrong event order: eventstore-postgresql-serverless [\#1866](https://github.com/reimagined/resolve/issues/1866)
- create-resolve-app failed on node 10.15 [\#1855](https://github.com/reimagined/resolve/issues/1855)

## [V0.30.2](https://github.com/reimagined/resolve/tree/V0.30.2) (2021-05-07)

[Full Changelog](https://github.com/reimagined/resolve/compare/V0.30.1...V0.30.2)

**Enhancements:**

- Update typescript to 4.2.4 [\#1847](https://github.com/reimagined/resolve/pull/1847)
- Postgresql fixes and tests [\#1846](https://github.com/reimagined/resolve/pull/1846)

**Bug fixes:**

- Unable to apply more than one hundred events to read-model [\#1853](https://github.com/reimagined/resolve/issues/1853)
- NPM audit reports vulnerabilities [\#1848](https://github.com/reimagined/resolve/issues/1848)
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
