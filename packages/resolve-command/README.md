# **resolve-command**
[![npm version](https://badge.fury.io/js/resolve-command.svg)](https://badge.fury.io/js/resolve-command)

Provides a function to handle a command and send the generated event to an [event store](../resolve-es) based on definitions of [aggregates](../resolve-scripts/src/template#aggregates-and-read-models-) and their commands. 

## Usage
When initializing a command, pass the following arguments:

* `eventStore`  
	A configured [eventStore](../resolve-es) instance.
	
* `aggregates`  
	An array of [aggregates](../resolve-scripts/src/template#aggregates-and-read-models-).  

After the command is initialized, you get a function that is used to send an event to the event store. It receives two arguments:
* `command`
	An object with the following fields:
	* `aggregateId` - a unique aggregate id.
	* `aggregateName` - the name of aggregate that has to handle the command.
	* `type` - the command type.
	
	A command may also have some additional payload.

 * `jwtToken`  
   Non-verified actual JWT token provided from client.

### Example
Define a news handling aggregate (see the  `news-aggregate.js` file), use the `resolve-command` library to execute the `createNews` command and send the corresponding event to the specified event store. To see a read model handling events which this aggregate produces, refer to the [resolve-query](../resolve-query#example) package documentation.

```js
import commandHandler from 'resolve-command'
import createEsStorage from 'resolve-storage-lite'
import createBusAdapter from 'resolve-bus-memory'
import createEventStore from 'resolve-es'

// the news-aggregate.js file is placed below
import newsAggregate from './news-aggregate'

const aggregates = [newsAggregate]

const eventStore = createEventStore({ storage: createEsStorage(), bus: createBusAdapter() })

eventStore.onEvent(['NewsCreated'], event =>
  console.log('Event emitted', event)
)

const execute = commandHandler({
  eventStore,
  aggregates
})

const command = {
  aggregateId: '1',
  aggregateName: 'news',
  type: 'createNews',
  payload: {
    title: 'News',
    userId: 'user-id',
    text: 'News content'
  }
}

execute(command).then(event => {
  console.log('Event saved', event);
})
```

##### news-aggregate.js
```js
import Immutable from 'seamless-immutable'

export default {
  name: 'news',
  initialState: Immutable({}),
  projection: {
    NEWS_CREATED: (state, { payload: { userId } }) =>
      state.merge({
        createdAt: Date.now(),
        createdBy: userId,
        voted: [],
        comments: {}
      }),

    NEWS_UPVOTED: (state, { payload: { userId } }) =>
      state.update('voted', voted => voted.concat(userId)),

    NEWS_UNVOTED: (state, { payload: { userId } }) =>
      state.update('voted', voted =>
        voted.filter(curUserId => curUserId !== userId)
      ),
    COMMENT_CREATED: (state, { payload: { commentId, userId } }) =>
      state.setIn(['comments', commentId], {
        createdAt: Date.now(),
        createdBy: userId
      }),

    COMMENT_REMOVED: (state, { payload: { commentId } }) =>
      state.setIn(['comments', commentId, 'removedAt'], Date.now())
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

      return new Event('NEWS_CREATED', {
        title,
        text,
        link,
        userId
      })
    },

    upvoteNews: (state, { payload: { userId } }) => {
      if (!state.createdAt || state.removedAt) {
        throw new Error('Aggregate is not exist')
      }

      if (state.voted.includes(userId)) {
        throw new Error('User already voted')
      }

      if (!userId) {
        throw new Error('UserId is required')
      }

      return new Event('NEWS_UPVOTED', {
        userId
      })
    },

    unvoteNews: (state, { payload: { userId } }) => {
      if (!state.createdAt || state.removedAt) {
        throw new Error('Aggregate is not exist')
      }

      if (!state.voted.includes(userId)) {
        throw new Error('User has not voted')
      }

      if (!userId) {
        throw new Error('UserId is required')
      }

      return new Event('NEWS_UNVOTED'  , {
        userId
      })
    },

    deleteNews: (state) => {
        if (!state.createdAt || state.removedAt) {
          throw new Error('Aggregate is not exist')
        }

      return new Event('NEWS_DELETED')
    },

    createComment: (state, { payload: { text, parentId, userId, commentId } }) => {
      if (!state.createdAt || state.removedAt) {
        throw new Error('Aggregate is not exist')
      }

      if (!text) {
        throw new Error('Text is required')
      }

      if (!parentId) {
        throw new Error('ParentId is required')
      }

      if (!userId) {
        throw new Error('UserId is required')
      }

      return new Event('COMMENT_CREATED', {
        text,
        parentId,
        userId,
        commentId
      })
    },

    updateComment: (state, { payload : { text, commentId, userId } }) => {
      if (!state.createdAt || state.removedAt) {
        throw new Error('Aggregate is not exist')
      }

      if (state.createdBy !== userId) {
        throw new Error('Permission denied')
      }

      if (!text) {
        throw new Error('Text is required')
      }

      return new Event('COMMENT_UPDATED', {
        text,
        commentId
      })
    },

    removeComment: (state, { payload: { commentId, userId } }) => {
      if (!state.createdAt || state.removedAt) {
        throw new Error('Aggregate is not exist')
      }

      if (state.createdBy !== userId) {
        throw new Error('Permission denied')
      }

      return new Event('COMMENT_REMOVED', { commentId })
    }
  }
}
```
