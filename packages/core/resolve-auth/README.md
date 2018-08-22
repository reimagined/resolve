# **resolve-auth**
[![npm version](https://badge.fury.io/js/resolve-auth.svg)](https://badge.fury.io/js/resolve-auth)

Provides an authentication mechanism using [Passport](http://www.passportjs.org/) authentication strategy.

## Usage

First of all, create file with your strategy and add `auth` section into `config.app.json` for your application (see [`hacker-news` example]('../../examples/hacer-news')).
Next, choose a type of authentication strategy (see [passport-local](https://github.com/jaredhanson/passport-local) or [passport-google-oauth](https://github.com/jaredhanson/passport-google-oauth for example) ) and define options of it.
Create your strategy in `strategyConstructor` function using `options`.
Return an array of tuples `{ strategy, options }` for every used route in your app.

## Examples

Here is the simple example of `local` strategy, but you can use any other [Passport](http://www.passportjs.org/) strategy similarly.

```javascript
import { Strategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import jwtSecret from './jwtSecret'

const options = routes.map(({ path, method, callback }) => ({
  strategy: {
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null
  },
  route: {
    path: '/register',
    method: 'POST'
  },
  callback: async (_, username) =>
    jwt.sign(           // here fake use is created
      {                   // for user storing into db see HakerNews example
        name: username    // https://github.com/reimagined/resolve/tree/master/examples/hacker-news
      },
      jwtSecret
    )
}))

const strategyConstructor = options =>
  new Strategy(
    {
      ...options.strategy,
      passReqToCallback: true
    },
    async (req, username, password, done) => {
      try {
        done(null, await options.callback(req, username, password))
      } catch (error) {
        done(error)
      }
    }
  )

export default [{ options, strategyConstructor }]

```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-auth-readme?pixel)
