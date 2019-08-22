# **resolve-command**
[![npm version](https://badge.fury.io/js/resolve-command.svg)](https://badge.fury.io/js/resolve-command)

Provides a function to handle a command and send the generated event to an [event store](../resolve-es) based on definitions of [aggregates](../resolve-scripts/src/template#aggregates-and-read-models-) and their commands. 

## Usage
When initializing a command, pass the following arguments:

* `eventStore`  
	A configured [eventStore](../resolve-es) instance.
	
* `aggregates`  
	An array of [aggregates](../resolve-scripts/src/template#aggregates-and-read-models-).  

Each aggregate can have optional property `snapshotAdapter` for managing snapshots mechanism. If property had not been passed, snapshots are turned off by default.
Property `snapshotAdapter` receives the adapter for loading and saving intermediate aggregate state.


After the command is initialized, you get a function that is used to send an event to the event store. It receives two arguments:
* `command`
	An object with the following fields:
	* `aggregateId` - a unique aggregate id.
	* `aggregateName` - the name of aggregate that has to handle the command.
	* `type` - the command type.
	* `jwtToken` - non-verified actual JWT token provided from client.

### Example
Define a news handling aggregate (see the  `news-aggregate.js` file), use the `resolve-command` library to execute the `createNews` command and send the corresponding event to the specified event store. To see a read model handling events which this aggregate produces, refer to the [resolve-query](../resolve-query#example) package documentation.

[mdis]:# (../../../tests/resolve-command/index.test.js)
```js
import createStorageLiteAdapter from 'resolve-storage-lite'
import createCommandExecutor from 'resolve-command'
import createEventStore from 'resolve-es'
import newsAggregate from './news-aggregate'
...
  const aggregates = [newsAggregate]
  const memoryStorage = createStorageLiteAdapter({ databaseFile: ':memory:' })
  const eventStore = createEventStore({ storage: memoryStorage })

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates
  })

  const event = await executeCommand({
    aggregateId: 'aggregate-id',
    aggregateName: 'news',
    type: 'createNews',
    payload: {
      title: 'News',
      userId: 'user-id',
      text: 'News content'
    }
  })
```

##### news-aggregate.js
[mdis]:# (../../../tests/resolve-command/news-aggregate.js)
```js
import Immutable from 'seamless-immutable'

export default {
  name: 'news',
  projection: {
    Init: () => Immutable({}),
    NEWS_CREATED: (state, { payload: { userId } }) =>
      state.merge({
        createdAt: Date.now(),
        createdBy: userId,
        voted: [],
        comments: {}
      })
  },
  commands: {
    createNews: (state, { payload: { title, link, userId, text } }) => {
      if (state.createdAt) {
        throw new Error('Aggregate already exists')
      }

      if (!title) {
        throw new Error('Title is required')
      }

      if (!userId) {
        throw new Error('UserId is required')
      }

      return {
        type: 'NEWS_CREATED',
        payload: {
          title,
          text,
          link,
          userId
        }
      }
    }
  }
}
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-command-readme?pixel)
