# **resolve-auth**
[![npm version](https://badge.fury.io/js/resolve-auth.svg)](https://badge.fury.io/js/resolve-auth)

Provides an authentication mechanism with several possible variants:
  - local strategy
  - github
  - google

## Usage

First of all, create file with your strategy and add `auth` section into `resolve.config.json` for your application (see [`with-authentication` example]('../../examples/with-authentication')).
Next, choose a type of authentication strategy (now we support `local`, `github` and `google`) and define options of it - add authentication `routes` that configure the strategy routing, describe `strategy` specified params  and  write code for `handlers`:
Return an array of tuples `{ strategy, options }` for every used authentication algorithm.

## Examples

### Local strategy example

```javascript
import { Strategy as strategy } from 'passport-local' // <- strategy type
import jwt from 'jsonwebtoken'
import uuid from 'uuid'

const options = {
  strategy: {
    usernameField: 'username',
    successRedirect: null
  },
  routes: {
    register: {
      path: '/register',
      method: 'POST'
    }
  },
  registerCallback: async (_, username) => { // here fake use is created
    const user = {                           // for user storing into db see HakerNews example
      name: username                         // https://github.com/reimagined/resolve/tree/master/examples/hacker-news
    }

    return jwt.sign(user, process.env.SECRET_JWT)
  },
  failureCallback: (error, redirect) => {
    redirect(`/`) // in case of fail
  }
}

export default [{ strategy, options }]

```

### Github authectication strategy example
```javascript

import { Strategy as strategy } from 'passport-github'
import jwt from 'jsonwebtoken'

const options = {
  strategy: {
    clientID: 'MyClientID',
    clientSecret: 'MyClientSecret',
    callbackURL: 'http://localhost:3000/auth/github/callback',
    successRedirect: null
  },
  routes: {
    auth: {
      path: '/auth/github',
      method: 'get'
    },
    callback: {
      path: '/auth/github/callback',
      method: 'get'
    }
  },
  authCallback: async ({ resolve, body }, profile) => {
    // your code to authenticate a user
    return jwt.sign(user, process.env.SECRET_JWT)
  },
  (error, redirect, { resolve, body }) => {
    // in case of fail
  }
}

export default [{ strategy, options }]
```

### Google authectication strategy example

```javascript
import { Strategy as strategy } from 'passport--google-oauth2'
import jwt from 'jsonwebtoken'

const options = {
  strategy: {
    clientID: 'MyClientID',
    clientSecret: 'MyClientSecret',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    successRedirect: null
  },
  routes: {
    auth: {
      path: '/auth/google',
      method: 'get'
    },
    callback: {
      path: '/auth/google/callback',
      method: 'get'
    }
  },
  authCallback: async ({ resolve, body }, profile) => {
    // your code to authenticate a user
  },
  (error, redirect, { resolve, body }) => {
    // in case of fail
  }
}

export default [{ strategy, options }]

```

