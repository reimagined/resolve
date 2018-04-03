# **resolve-auth**
[![npm version](https://badge.fury.io/js/resolve-auth.svg)](https://badge.fury.io/js/resolve-auth)

Provides an authentication mechanism with several possible variants:
  - local strategy
  - github
  - google

## Usage

First of all, create file with your strategy and add `auth` section into `resolve.config.json` for your application (see [`auth` example]('../../examples/auth')).
Next, choose type of auth strategy (now we support `local`, `github` and `google`) and write code for it.

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
  loginCallback: async (_, username) => {
    const user = {
      name: username
    }

    return jwt.sign( user, process.env.SECRET_JWT)
  },
  failureCallback: (error, redirect) => {
    redirect(`/`)
  }
}

export default [{ strategy, options }]

```

### Github authectication strategy example

### Google authectication strategy example
