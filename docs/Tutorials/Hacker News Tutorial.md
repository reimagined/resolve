# Reproducing Hacker News using ReSolve

> Note: this tutorial is actual for 0.4.0 version.

This tutorial shows you how to create a **Hacker News** application and consists of the following steps:

* [Requirements](#requirements)
* [Creating a New ReSolve Application](#creating-a-new-resolve-application)
* [Domain Model Analysis](#domain-model-analysis)
* [Adding Users](#adding-users)
  * [Write Side](#write-side)
  * [Read Side](#read-side)
  * [Authentication](#authentication)
  * [Error View](#error-view)
  * [Login View](#login-view)
  * [User View](#user-view)
* [Adding Stories](#adding-stories)
  * [Write Side](#write-side-1)
  * [Read Side](#read-side-1)
  * [GraphQL](#graphql)
  * [Stories View](#stories-view)
  * [View Model](#view-model)
  * [Story View](#story-view)
  * [Submit View](#submit-view)
* [Adding Comments](#adding-comments)
  * [Write Side](#write-side-2)
  * [Read Side](#read-side-2)
  * [GraphQL](#graphql-1)
  * [View Model](#view-model-1)
  * [Story View Extension](#story-view-extension)
  * [Comments View](#comments-view)
  * [Page Not Found View](#page-not-found-view)
* [Data Importer](#data-importer)

This demo is implemented using the [reSolve](https://github.com/reimagined/resolve) framework.
You need to be familiar with React and Redux, as well as with DDD, CQRS and Event Sourcing.
If you are new to these concepts, refer to the following links to learn the basics:

* [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
* [Command/Query Responsibility Segregation and Domain-Driven Design](http://cqrs.nu/)
* [React](https://reactjs.org/)
* [Redux](http://redux.js.org/docs/introduction/)
* [GraphQL](http://graphql.org/learn/)

You can also read the following articles for more information:

* [Why using DDD, CQRS and Event Sourcing](https://github.com/cer/event-sourcing-examples/wiki/WhyEventSourcing)
* [Building Scalable Applications Using Event Sourcing and CQRS](https://medium.com/technology-learning/event-sourcing-and-cqrs-a-look-at-kafka-e0c1b90d17d8)
* [May the source be with you](http://arkwright.github.io/event-sourcing.html)
* [Using logs to build a solid data infrastructure](https://www.confluent.io/blog/using-logs-to-build-a-solid-data-infrastructure-or-why-dual-writes-are-a-bad-idea/)

## Requirements

* node 6.13.1, or later
* npm 3.10.10, or later

## Creating a New ReSolve Application

Use the [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) CLI tool to create a new reSolve project.

Install create-resolve-app globally.

```
npm i -g create-resolve-app
```

Create an empty reSolve project and run the application in the development mode.

```
create-resolve-app hn-resolve
cd hn-resolve
npm run dev
```

The application opens in the browser at [http://localhost:3000/](http://localhost:3000/).

After the installation is completed, your project has the default structure:

![Project structure](https://user-images.githubusercontent.com/14352827/37818234-8801e944-2e8a-11e8-8d1c-550a84c06dec.png)

## Domain Model Analysis

At this point, you need to analyze the domain.
Event Sourcing and CQRS require identifying Domain Aggregates and their corresponding commands and events which are used to build the required read models.

**Hacker News** is a social news website focusing on computer science.
Its users can post news, ask questions, comment on news, and reply to comments.
These posts are called **Stories**.

**Users** can post **Stories** and **Comments**.
* Story - news or question
* Comment - a short message written about news or question
* User - a registered and logged in user that can perform actions (post news, ask questions, write comments)

Next, identify domain aggregate roots by detecting which commands the **Hacker News** application should perform and which entities they are addressed to:
* create a **User**
* create a **Story**
* comment a **Story**
* upvote a **Story**
* unvote a **Story**

You only need the User and Story aggregate roots since there are no commands addressed to Comment.
Note that when using CQRS and Event Sourcing, you need to identify which events should be captured on the Write Side, and then compose a list of Read Side models from these events.

To summarize the domain analysis:

There are two aggregate roots - User and Story with the following commands and events:
* User
  * CreateUser generates the UserCreated event
* Story
  * CreateStory generates the StoryCreated event
  * CommentStory generates the StoryCommented event
  * UpvoteStory generates the StoryUpvoted event
  * UnvoteStory generates the StoryUnvoted event

## Adding Users

Add user registration and authentication functionality to the application.
For demo purposes, we omitted password checking.
If needed, you can implement hashing and storing passwords later.

A user has the following fields:
* id - a unique user ID automatically created on the server side
* name - a unique user name which a user provides in the registration form
* createdAt - the user's registration timestamp

### Write Side

Create a user aggregate.
Implement event types:

```js
// ./common/events.js

export const USER_CREATED = 'UserCreated'
```

Add the `createUser` command that should return the `UserCreated` event.
Validate input data to ensure that a user name exists and it is not empty.
Add projection handlers and an initial state to check whether a user already exists.

```js
// ./common/aggregates/validation.js

export default {
  stateIsAbsent: (state, type) => {
    if (Object.keys(state).length > 0) {
      throw new Error(`${type} already exists`)
    }
  },

  fieldRequired: (payload, field) => {
    if (!payload[field]) {
      throw new Error(`The "${field}" field is required`)
    }
  }
}
```

```js
// ./common/aggregates/user.js

import { USER_CREATED } from '../events'
import validate from './validation'

export default {
  name: 'user',
  initialState: {},
  commands: {
    createUser: (state, command) => {
      validate.stateIsAbsent(state, 'User')

      const { name } = command.payload

      validate.fieldRequired(command.payload, 'name')

      return { type: USER_CREATED, payload: { name } }
    }
  },
  projection: {
    [USER_CREATED]: (state, { timestamp }) => ({
      ...state,
      createdAt: timestamp
    })
  }
}

```

Add aggregate for passing to the config.

```js
// ./common/aggregates/index.js

import user from './user'

export default [user]
```

### Read Side

Implement a read side.
The simplest way to store users is using a store collection.

```js
// ./common/read-models/projection.js

import {
  USER_CREATED
} from '../events'

export default {
  Init: async store => {
    await store.defineStorage('Users', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'name', type: 'string', index: 'secondary' },
      { name: 'createdAt', type: 'number' }
    ])
  },

  [USER_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    const user = {
      id: aggregateId,
      name,
      createdAt: timestamp
    }
    await store.insert('Users', user)
  }
}

```

Describe a schema and implement resolvers to get data using GraphQL:

```js
// ./common/read-models/graphql/schema.js

export default `
  type User {
    id: ID!
    name: String
    createdAt: String
  }
  type Query {
    user(id: ID, name: String): User
  }
`
```

Implement resolvers:

```js
// ./common/read-models/graphql/resolvers.js

export default {
 user: async (store, { id, name }) => {
    const user = id
      ? await store.find('Users', { id })
      : await store.find('Users', { name })

    return user.length > 0 ? user[0] : null
  }
}
```

Export the read model's GraphQL parts from the `graphql` folder root:

```js
// ./common/read-models/graphql/index.js

import projection from './projection'
import gqlResolvers from './resolvers'
import gqlSchema from './schema'

export default {
  projection,
  gqlSchema,
  gqlResolvers
}
```

Update the `read-models` folder export:

```js
// ./common/read-models/index.js

import graphqlReadModel from './graphql'

export default [graphqlReadModel]
```

### Authentication

After adding a storage for users, create the local authentication strategy and implement the required callbacks.


Install `uuid` package:
```
npm install --save uuid
```

In the `auth/` directory, create `./auth/localStrategy.js` file. `passwordField` has same value as `usernameField` because this app does not use a password.

```js
// ./auth/localStrategy.js

export default {
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  },
  registerCallback: async ({ resolve, body }, username, password) => {
    // ...
  },
  loginCallback: async ({ resolve, body }, username, password) => {
    // ...
  }
}

```

Implement the `getUserByName` function that uses the `executeQuery` function passed with `registerCallback` and `loginCallback`:

```js
// ./auth/localStrategy.js

const getUserByName = async (executeQuery, name) => {
  const { user } = await executeQuery(
    `query ($name: String!) {
      user(name: $name) {
        id,
        name,
        createdAt
      }
    }`,
    { name: name.trim() }
  )

  return user
}

export default {
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  },
  registerCallback: async ({ resolve, body }, username, password) => {
    // ...
  },
  loginCallback: async ({ resolve, body }, username, password) => {
    // ...
  }
}
```

Add the required authentication parameters:

```js
// ./auth/constants.js

export const authenticationSecret = 'auth-secret'
export const cookieName = 'authenticationToken'
export const cookieMaxAge = 1000 * 60 * 60 * 24 * 365
```

Update the `registerCallback` and `loginCallback` callbacks. Use the `resolve` parameter to access the query and command executors.

Add `failureCallback` function to provide the redirection path in case of a failure:

```js
// ./auth/localStrategy.js

import uuid from 'uuid'

const getUserByName = async (executeQuery, name) => {
  const { user } = await executeQuery(
    `query ($name: String!) {
      user(name: $name) {
        id,
        name,
        createdAt
      }
    }`,
    { name: name.trim() }
  )

  return user
}

export default {
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  },
  registerCallback: async ({ resolve, body }, username, password) => {
    const executeQuery = resolve.queryExecutors.graphql

    const existingUser = await getUserByName(executeQuery, username)

    if (existingUser) {
      throw new Error('User already exists')
    }

    const user = {
      name: username.trim(),
      id: uuid.v4()
    }

    await resolve.executeCommand({
      type: 'createUser',
      aggregateId: user.id,
      aggregateName: 'user',
      payload: user
    })

    return user
  },
  loginCallback: async ({ resolve, body }, username, password) => {
    const user = await getUserByName(resolve.queryExecutors.graphql, username)

    if (!user) {
      throw new Error('No such user')
    }

    return user
  },
  failureCallback: (error, redirect, { resolve, body }) => {
    redirect(`/error?text=${error}`)
  }
}
```

Install `jsonwebtoken` package in order to get user from cookies.

```
npm install --save jsonwebtoken
```

Add the `me` resolver to pass a user to the client side.

```js
// ./commmon/read-models/resolvers.js
import jwt from 'jsonwebtoken'
import jwtSecret from './jwtSecret'

export default {
  // user implementation

   me: async (store, _, { jwtToken }) => {
    if (!jwtToken) {
      return null
    }
    const user = await jwt.verify(
      jwtToken,
      jwtSecret
    )
    return user
  }
}
```

Update graphql schema
```js
// ./common/read-models/graphql/schema.js

export default `
  type User {
    id: ID!
    name: String
    createdAt: String
  }
  type Query {
    user(id: ID, name: String): User
    me: User
  }
`
```

Pass the authentication and JWT parameters to the server config:

```js
// ./resolve.server.config.js

import path from 'path'
import fileAdapter from 'resolve-storage-lite'
import busAdapter from 'resolve-bus-memory'
import { localStrategy } from 'resolve-scripts-auth'

import aggregates from './common/aggregates'
import readModels from './common/read-models'
import clientConfig from './resolve.client.config'
import localStrategyParams from './auth/localStrategy'

import {
  authenticationSecret,
  cookieName,
  cookieMaxAge
} from './auth/constants'

if (module.hot) {
  module.hot.accept()
}


const { NODE_ENV = 'development' } = process.env
const dbPath = path.join(__dirname, `${NODE_ENV}.db`)

export default {
  entries: clientConfig,
  bus: { adapter: busAdapter },
  storage: {
    adapter: fileAdapter,
    params: { pathToFile: dbPath }
  },
  aggregates,
  initialSubscribedEvents: { types: [], ids: [] },
  readModels,
  jwtCookie: {
    name: cookieName,
    maxAge: cookieMaxAge,
    httpOnly: false
  },
  auth: {
    strategies: [localStrategy(localStrategyParams)]
  }
}
```

Now the server side works with users: a user can be registered and authenticated.

### Error View

Install the following packages:
* `query-string` - to parse the `search` location part

```bash
npm install --save query-string
```

Implement the [Error](./client/components/Error.js) component to display error messages.

### Login View

The app layout contains meta information, an application header with a menu, user info and some content.

Install the following packages:
* `react-helmet` - to pass meta information to the HTML header
* `react-router` - to implement routing
* `redux` and `react-redux` - to store data
* `seamless-immutable` - to enforce state immutability
* `js-cookie` - to manipulate cookies
* `styled-components` -  to style components

```bash
npm install --save react-helmet react-router react-router-dom seamless-immutable js-cookie styled-components
```

Implement the login view which is based on the [AuthForm](./client/components/AuthForm.js) component and rendered by the [Login](./client/components/Login.js) component.

The login view is placed in the main layout.
Follow the steps below to implement the layout:
* Prepare Redux [user actions](./client/actions/userActions.js).
* Add the [Splitter](./client/components/Splitter.js) component that serves as a vertical menu splitter.
* Add the [Layout](./client/components/Layout.js) container implementing the layout.
* Add the [LoginInfo](./client/containers/LoginInfo.js) container implementing the login/logout menu.
In the `containers/Layout.js` file, comment the `uiActions` import and the `onSubmitViewShown` action in the `mapDispatchToProps` function, and add the header's [logo](./static/reSolve-logo.svg).

Add the layout and login view to the root component.

* Add routes. To do this, create the `./client/routes.js` file.
In this file, comment all imports except the `Layout` container and `Login` component, and all routes except the `/login` path.
* Implement the `RouteWithSubRoutes` component to provide routes.

Use a Redux store for data storing.
In the [./client/store/index.js](./client/store/index.js) file, add the [devtools](https://github.com/zalmoxisus/redux-devtools-extension) and [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux#-utils) middlewares and implement the logout middleware. Replace the `viewModels` array with an empty array (comment out its import and usage).

Prepare the [App](./client/components/App.js) component by adding router providers.

Now you can go to http://localhost:3000 to see the login view.

### User View

Implement the user view to show an authenticated user.

To get user data using GraphQL, import the `gqlConnector` from the `resolve-redux` package.

Implement the [UserById](./client/containers/UserById.js) container and uncomment this container import in [routes](./client/routes.js) and add the `/user/:userId` path.

## Adding Stories

A story is news or a question a user posts.
In **Hacker News**, stories are displayed on the following pages:
* Newest - the newest stories
* Ask - users’ questions (Ask HNs)
* Show - users’ news (Show HNs)

A story can have the following fields:
* id - a unique ID
* title - the story's title
* link - a link to the original news or external website
* text - the story's content
* createdAt - the story's creation timestamp
* createdBy - the story's author

### Write Side

Add the story aggregate and the `createStory` command to create a story, and the `storyCreated` handler to validate input data and check whether the aggregate exists.
In the original **Hacker News**, users can upvote and unvote stories.
This can be accomplished by adding the corresponding commands to the story aggregate:

```js
// ./common/aggregates/validation.js

export default {
  // stateIsAbsent and fieldRequired implementation

  stateExists: (state, type) => {
    if (!state || Object.keys(state).length === 0) {
      throw new Error(`${type} does not exist`)
    }
  },

  itemIsNotInArray: (array, item, errorMessage = 'Item is already in array') => {
    if (array.includes(item)) {
      throw new Error(errorMessage)
    }
  },

  itemIsInArray: (array, item, errorMessage = 'Item is not in array') => {
    if (!array.includes(item)) {
      throw new Error(errorMessage)
    }
  }
}
```

Update event list by adding story event names:

```js
// ./common/events.js
import jwt from 'jsonwebtoken'

export const STORY_CREATED = 'StoryCreated'
export const STORY_UPVOTED = 'StoryUpvoted'
export const STORY_UNVOTED = 'StoryUnvoted'

export const USER_CREATED = 'UserCreated'
```

```js
import jwtSecret from '../../auth/jwtSecret'

import {
  STORY_CREATED,
  STORY_UPVOTED,
  STORY_UNVOTED
} from '../events'

import validate from './validation'

export default {
  name: 'story',
  initialState: {},
  commands: {
    createStory: (state, command, jwtToken) => {
     const { id: userId, name: userName } = jwt.verify(
        jwtToken,
        jwtSecret
      )
      validate.stateIsAbsent(state, 'Story')

      const { title, link, text } = command.payload

      validate.fieldRequired(command.payload, 'title')

      return {
        type: STORY_CREATED,
        payload: { title, text, link, userId, userName }
      }
    },

    upvoteStory: (state, command, jwtToken) => {
      const { id: userId } = jwt.verify(
        jwtToken,
       jwtSecret
      )

      validate.stateExists(state, 'Story')
      validate.itemIsNotInArray(state.voted, userId, 'User already voted')

      return { type: STORY_UPVOTED, payload: { userId } }
    },

    unvoteStory: (state, command, jwtToken) => {
     const { id: userId } = jwt.verify(
        jwtToken,
        jwtSecret
      )

      validate.stateExists(state, 'Story')
      validate.itemIsInArray(state.voted, userId, 'User did not vote')

      return { type: STORY_UNVOTED, payload: { userId } }
    }
  },
  projection: {
    [STORY_CREATED]: (
      state,
      { timestamp, payload: { userId } }: StoryCreated
    ) => ({
      ...state,
      createdAt: timestamp,
      createdBy: userId,
      voted: [],
      comments: {}
    }),

    [STORY_UPVOTED]: (state, { payload: { userId } }) => ({
      ...state,
      voted: state.voted.concat(userId)
    }),

    [STORY_UNVOTED]: (state, { payload: { userId } }) => ({
      ...state,
      voted: state.voted.filter(curUserId => curUserId !== userId)
    })
  }
}
```

Modify the `aggregates` default export:

```js
// ./common/aggregates/index.js

import user from './user'
import story from './story'

export default [user, story]
```

Add all the event names to the server config:

```js
// ./resolve.server.config.js

// import list
import * as events from './common/events'

// module hot acceptions and store initialization

const eventTypes = Object.keys(events).map(key => events[key])

export default {
    // other options
    initialSubscribedEvents: { types: eventTypes, ids: [] }
}
```

### Read Side

Add a collection of stories as the first read side implementation step:

```js
// ./common/read-models/projection.js

import {
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED
} from '../events'

export default {
  Init: async store => {
    await store.defineStorage('Stories', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'type', type: 'string', index: 'secondary' },
      { name: 'title', type: 'string' },
      { name: 'text', type: 'string' },
      { name: 'link', type: 'string' },
      { name: 'commentCount', type: 'number' },
      { name: 'votes', type: 'json' },
      { name: 'createdAt', type: 'number' },
      { name: 'createdBy', type: 'string' },
      { name: 'createdByName', type: 'string' }
    ])

    await store.defineStorage('Users', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'name', type: 'string', index: 'secondary' },
      { name: 'createdAt', type: 'number' }
    ])
  },

  [STORY_CREATED]: async (
    store,
    {
      aggregateId,
      timestamp,
      payload: { title, link, userId, userName, text }
    }
  ) => {
    const type = !link ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

    const story = {
      id: aggregateId,
      type,
      title,
      text,
      link,
      commentCount: 0,
      votes: [],
      createdAt: timestamp,
      createdBy: userId,
      createdByName: userName
    }

    await store.insert('Stories', story)
  },

  [STORY_UPVOTED]: async (
    store,
    { aggregateId, payload: { userId } }
  ) => {
    const story = await store.findOne(
      'Stories',
      { id: aggregateId },
      { votes: 1 }
    )
    await store.update(
      'Stories',
      { id: aggregateId },
      { $set: { votes: story.votes.concat(userId) } }
    )
  },

  [STORY_UNVOTED]: async (
    store,
    { aggregateId, payload: { userId } }
  ) => {
    const story = await store.findOne(
      'Stories',
      { id: aggregateId },
      { votes: 1 }
    )
    await store.update(
      'Stories',
      { id: aggregateId },
      { $set: { votes: story.votes.filter(vote => vote !== userId) } }
    )
  }
  // USER_CREATED implementation
}
```

### GraphQL

The **Hacker News** application displays a list of stories without additional information.
For this, support the GraphQL with GraphQL resolvers that works with read model collections.

Add the `./common/read-models/gqlSchema.js` file.
Describe the `Story` type and a query used to request a list of stories - the `stories` query:

```js
// ./common/read-models/graphql/schema.js

export default `
  type User {
    id: ID!
    name: String
    createdAt: String
  }
  type Story {
    id: ID!
    type: String!
    title: String!
    link: String
    text: String
    commentCount: Int!
    votes: [String]
    createdAt: String!
    createdBy: String!
    createdByName: String!
  }
  type Query {
    user(id: ID, name: String): User
    me: User
    stories(type: String, first: Int!, offset: Int): [Story]
  }
`
```

Add the appropriate resolvers:

```js
// ./common/read-models/graphql/resolvers.js
import jwt from 'jsonwebtoken'

export default {
  // user implementation
  // me implementation
  stories: async (store, { type, first, offset }) => {
    const skip = first || 0
    const params = type ? { type } : {}
    const stories = await store.find(
      'Stories',
      params,
      null,
      { createdAt: -1 },
      skip,
      skip + offset
    )
    if (!stories) {
      return []
    }
    return stories
  }
}
```

### Stories View

Implement a component rendering a list of stories.

Install the following packages:
* url - to parse URLs
* plur - to pluralize words
* sanitizer - to sanitize story content markup

```bash
npm i --save url plur sanitizer
```

Add the [Pagination](./client/components/Pagination.js) component.

Implement [stories actions](./client/actions/storiesActions.js).

Add the [TimeAgo](./client/components/TimeAgo.js) component.

Then add the [Story](./client/containers/Story.js) container.

Create [client constants](./client/constants.js).

Implement the [Stories](./client/components/Stories.js) component to display stories.

Implement story-specific containers such as [NewestByPage](./client/containers/NewestByPage.js), [AskByPage](./client/containers/AskByPage.js) and [ShowByPage](./client/containers/ShowByPage.js).
In each file, delete the `query`'s `commentCount` field.

In the `client/reducers/` directory, create the [optimistic](./client/reducers/optimistic.js) reducer and add it to the [root reducer export](./client/reducers/index.js).

Add the created containers to the [routes](./client/routes.js) with the `/`, `/newest/:page?`, `/show/:page?` and `/ask/:page?` paths.

### View Model

The **Hacker News** application can display a specific story with additional information. To add this feature, implement the `storyDetails` view model.

Add the `./common/view-models/storyDetails.js` file:

```js
// ./common/view-models/storyDetails.js

import Immutable from 'seamless-immutable'


import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED
} from '../events'

export default {
  name: 'storyDetails',
  projection: {
    Init: () => Immutable({}),
    [STORY_CREATED]: (
      state: any,
      {
        aggregateId,
        timestamp,
        payload: { title, link, userId, text }
      }: Event<StoryCreated>
    ) => {
      const type = !link ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

      return Immutable({
        id: aggregateId,
        type,
        title,
        text,
        link,
        commentCount: 0,
        comments: [],
        votes: [],
        createdAt: timestamp,
        createdBy: userId
      })
    },

    [STORY_UPVOTED]: (
      state: any,
      { payload: { userId } }: Event<StoryUpvoted>
    ) => state.update('votes', votes => votes.concat(userId)),

    [STORY_UNVOTED]: (
      state: any,
      { payload: { userId } }: Event<StoryUnvoted>
    ) => state.update('votes', votes => votes.filter(id => id !== userId))
  },
  serializeState: (state: any) => JSON.stringify(state || {}),
  deserializeState: (state: any) => Immutable(JSON.parse(state))
}
```

Add view models' default export:

```js
// ./common/view-models/index.js

import storyDetails from './storyDetails'

export default [storyDetails]
```

Pass the view model to the server config:

```js
// ./resolve.server.config.js

import path from 'path'
import busAdapter from 'resolve-bus-memory'
import storageAdapter from 'resolve-storage-lite'
import { localStrategy } from 'resolve-scripts-auth'

import clientConfig from './resolve.client.config'
import aggregates from './common/aggregates'

import readModels from './common/read-models'
import viewModels from './common/view-models'

import localStrategyParams from './auth/localStrategy'

import {
  authenticationSecret,
  cookieName,
  cookieMaxAge
} from './auth/constants'

const databaseFilePath = path.join(__dirname, './storage.json')

const storageAdapterParams = process.env.IS_TEST
  ? {}
  : { pathToFile: databaseFilePath }

export default {
  entries: clientConfig,
  bus: { adapter: busAdapter },
  storage: {
    adapter: storageAdapter,
    params: storageAdapterParams
  },
  aggregates,
  readModels,
  viewModels,
  jwtCookie: {
    name: cookieName,
    maxAge: cookieMaxAge,
    httpOnly: false
  },
  auth: {
    strategies: [localStrategy(localStrategyParams)]
  }
}
```

### Story View

Implement the [StoryDetails](./client/containers/StoryDetails.js) container to display a story by ID with additional information.
`ChildrenComments` is implemented later, so delete its import and usage in JSX.

Add the created container to the [routes](./client/routes.js) with the `/storyDetails/:storyId` path.

Uncomment the `viewModels` import and add it to `resolveMiddleware(viewModels)` in the [client/store/index.js](./client/store/index.js) file.

### Submit View

Implement the [Submit](./client/containers/Submit.js) container to add new stories.

Add the created container to the [routes](./client/routes.js) with the `/submit` path.

## Adding Comments

Extend the application logic to allow users to comment.
A comment is a short message written about news or question and relates to a story.
Next, implement comments which reply to other comments.

A comment has the following fields:
* id - a unique ID
* parentId - the parent comment's id, or the story's id if it is a root comment
* storyId - the story's id
* text - the comment's content
* replies - a list of replies
* createdAt - the story's creation timestamp
* createdBy - the comment's author

### Write Side

Add a comment event to the [events](./common/events.js) file:

```js
// ./common/events.js

export const STORY_CREATED = 'StoryCreated'
export const STORY_UPVOTED = 'StoryUpvoted'
export const STORY_UNVOTED = 'StoryUnvoted'
export const STORY_COMMENTED = 'StoryCommented'

export const USER_CREATED = 'UserCreated'
```

Extend the [validation](./common/aggregates/validation.js) for commands:

```js
// ./common/aggregates/validation.js

export default {
  // other validation functions

  keyIsNotInObject: (object, key, errorMessage = 'Key is already in object') => {
    if (object[key]) {
      throw new Error(errorMessage)
    }
  }
}
```

You can use an existing story's aggregate without creating a particular aggregate for a comment, as it depends on the story.
Validate all input fields and check whether an aggregate exists:

```js
// ./common/aggregates/story.js

import {
  STORY_CREATED,
  STORY_UPVOTED,
  STORY_UNVOTED,
  STORY_COMMENTED
} from '../events'

import validate from './validation'
import jwtSecret from '../../auth/jwtSecret'

export default {
  name: 'story',
  initialState: {},
  commands: {
    // the createStory,  upvoteStory and unvoteStory implementation

    commentStory: (state, command, jwtToken) => {
      const { id: userId, name: userName } = jwt.verify(
        jwtToken,
        jwtSecret
      )
      validate.stateExists(state, 'Story')

      const { commentId, parentId, text } = command.payload

      validate.fieldRequired(command.payload, 'parentId')
      validate.fieldRequired(command.payload, 'text')
      validate.keyIsNotInObject(
        state.comments,
        commentId,
        'Comment already exists'
      )

      return {
        type: STORY_COMMENTED,
        payload: {
          commentId,
          parentId,
          userId,
          userName,
          text
        }
      }
    }
  },
  projection: {
    // the STORY_CREATED, STORY_UPVOTED and STORY_UNVOTED implementation
    [STORY_COMMENTED]: (
      state,
      { timestamp, payload: { commentId, userId } }: StoryCommented
    ) => ({
      ...state,
      comments: {
        ...state.comments,
        [commentId]: {
          createdAt: timestamp,
          createdBy: userId
        }
      }
    })
  }
}
```

### Read Side

**comment** and **story** have a single aggregate. However, you need to provide an independent `comments` collection for the GraphQL implementation. You should also update the `stories` collection.

```js
// ./common/read-model/projection.js

import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED
} from '../events'

export default {
  Init: async store => {
    // Stories defineStorage implementation
    // Users defineStorage implementation

    await store.defineStorage('Comments', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'text', type: 'string' },
      { name: 'parentId', type: 'string' },
      { name: 'comments', type: 'json' },
      { name: 'storyId', type: 'string' },
      { name: 'createdAt', type: 'number' },
      { name: 'createdBy', type: 'string' },
      { name: 'createdByName', type: 'string' }
    ])
  },

  // STORY_CREATED implementation
  // STORY_UPVOTED implementation
  // STORY_UNVOTED implementation
  // USER_CREATED implementation

  [STORY_COMMENTED]: async (
    store,
    {
      aggregateId,
      timestamp,
      payload: { parentId, userId, userName, commentId, text }
    }
  ) => {
    const comment = {
      id: commentId,
      text,
      parentId,
      comments: [],
      storyId: aggregateId,
      createdAt: timestamp,
      createdBy: userId,
      createdByName: userName
    }

    await store.insert('Comments', comment)
    await store.update(
      'Stories',
      { id: aggregateId },
      { $inc: { commentCount: 1 } }
    )
  }
}
```

### GraphQL

Extend the GraphQL schema file by adding the `Comment` type and queries.
A comment contains the `replies` field which is a list of comments, and provides a tree-like structure for all the included comments.


```js
// ./common/read-models/graphql/schema.js

export default `
  type User {
    id: ID!
    name: String
    createdAt: String
  }
  type Story {
    id: ID!
    type: String!
    title: String!
    link: String
    text: String
    commentCount: Int!
    votes: [String]
    createdAt: String!
    createdBy: String!
    createdByName: String!
  }
  type Comment {
    id: ID!
    parentId: ID!
    storyId: ID!
    text: String!
    replies: [Comment]
    createdAt: String!
    createdBy: String!
    createdByName: String
    level: Int
  }
  type Query {
    user(id: ID, name: String): User
    me: User
    stories(type: String, first: Int!, offset: Int): [Story]
    comments(first: Int!, offset: Int): [Comment]
    comment(id: ID!): Comment
  }
`
```

Implement comment resolvers and extend the stories resolver to get comments:

```js
// ./common/read-models/graphql/resolvers.js
import jwt from 'jsonwebtoken'

export default {
  // implemented resolvers

  stories: async (store, { type, first, offset }) => {
    const skip = first || 0
    const params = type ? { type } : {}
    const stories = await store.find(
      'Stories',
      params,
      null,
      { createdAt: -1 },
      skip,
      skip + offset
    )
    if (!stories) {
      return []
    }
    return stories
  },
  comments: async (store, { first, offset }) => {
    const skip = first || 0
    const comments = await store.find(
      'Comments',
      {},
      null,
      { createdAt: -1 },
      skip,
      skip + offset
    )
    if (!comments) {
      return []
    }
    return comments
  }
}
```

# View model

Update the `storyDetails` view model:

```js
// ./common/view-models/storyDetails.js

import Immutable from 'seamless-immutable'

import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED
} from '../events'

export default {
  name: 'storyDetails',
  projection: {
    Init: () => Immutable({}),

    // implemented handlers

    [STORY_COMMENTED]: (
      state,
      {
        aggregateId,
        timestamp,
        payload: { parentId, userId, userName, commentId, text }
      }
    ) => {
      const parentIndex =
        parentId === aggregateId
          ? -1
          : state.comments.findIndex(({ id }) => id === parentId)

      const level =
        parentIndex === -1 ? 0 : state.comments[parentIndex].level + 1

      const comment = {
        id: commentId,
        parentId,
        level,
        text,
        createdAt: timestamp,
        createdBy: userId,
        createdByName: userName
      }

      const newState = state.update('commentCount', count => count + 1)

      if (parentIndex === -1) {
        return newState.update('comments', comments => comments.concat(comment))
      } else {
        return newState.update('comments', comments =>
          comments
            .slice(0, parentIndex + 1)
            .concat(comment, comments.slice(parentIndex + 1))
        )
      }
    }
  },
  serializeState: (state: any) =>
    JSON.stringify(state || Immutable({})),
  deserializeState: (serial: any) => Immutable(JSON.parse(serial))
}
```

### Story View Extension

Add the [Comment](./client/components/Comment.js) component to display comment information.

Add the [ReplyLink](./client/components/ReplyLink.js) component to implement the 'reply' link.

Add the [ChildrenComments](./client/components/ChildrenComments.js) component for building a comments tree.

A comment depends on a story, so you need to extend the existing [StoryDetails](./client/containers/StoryDetails.js) container and add a comments tree with a text area for new comments.


### Comments View

Implement the [CommentsByPage](./client/containers/CommentsByPage.js) container to display a list of the latest comments.

Implement the [CommentsById](./client/containers/CommentById.js) container to display the selected comment with replies.

Add the created containers to [routes](./client/routes.js) with the `/comments/:page?` and `/storyDetails/:storyId/comments/:commentId` paths.
Note that the `/storyDetails/:storyId/comments/:commentId` path should be above the `/storyDetails/:storyId` path.

### Page Not Found View

Implement the [PageNotFound](./client/components/PageNotFound.js) component to display a message indicating that the requested page was not found.

Add the created container to the end of the the route list in the [routes](./client/routes.js) file.

## Data Importer

Implement an importer in the [import](./import) folder to get data from the original **Hacker News** website.
This importer uses the website's REST API and transforms data to events.
