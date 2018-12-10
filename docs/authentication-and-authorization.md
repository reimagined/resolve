---
id: authentication-and-authorization
title: Authentication and Authorization
---

## Setting up Authentication

ReSolve relies on the [Passport.js](http://www.passportjs.org/) library for authentication.

To specify authentication strategies for your reSolve application, register the path to a file defining these strategies in the **auth.strategies** config section:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/hacker-news/config.app.js /auth: \{/ /\}/)
```js
auth: {
    strategies: 'auth/local_strategy.js'
  }
```

<!-- prettier-ignore-end -->

The specified file should export an array. Each item in this array defines a strategy by providing a strategy constructor function along with a set of strategy options. You can define strategies using the following general format:

```js
// ./auth/index.js
import LocalStrategy from 'passport-local'
const jwtSecret = process.env.JWT_SECRET
export default [
  {
    strategyConstructor: options => {
      return new LocalStrategy(
        {
          customStrategyOption1: 'customStrategyOption1',
          customStrategyOption2: 'customStrategyOption2',
          passReqToCallback: true
        },
        async (req, username, password, done) => {
          try {
            done(null, { username }, jwtSecret)
          } catch (error) {
            done(error)
          }
        }
      )
    },
    options: {
      route: {
        path: '/auth/local',
        method: 'get'
      }
    }
  }
]
```

For a comprehensive code sample, refer to the [Hacker News](https://github.com/reimagined/resolve/tree/master/examples/hacker-news) example application.

## Using 3rd-Party Auth Services

You can implement authentication via 3rd-party services in the same way, in which you implement local authentication. To implement authentication for a particular service, use corresponding Passport modules, e.g., **passport-google** or **passport-facebook**.

## Making Your Own User Registry

If you prefer to store a user registry in your application, or if you use a third-party authentication service but need to store additional information that is not provided by this service (e.g., roles or permissions), then you can just stick to the standard event sourcing approach:

- Add a User aggregate to accept commands and generate events related to managing a user registry
- Create a read model and use it to look up a current user's information during logging in and put this information into a JWT (JSON Web Token)

For example, if you want to grant permissions to a user, you can write something like this:

Write side. "user" aggregate:

user.commands.js:

```js
...
grantPermission: (state, command) => {
   const {payload: {permission: permissionToGrant }} = command;

   if (state.permissions.includes(permissionToGrant)) {
       throw new Error("permission aleady granted")
   }
   return {
       type: PERMISSION_GRANTED,
       payload: {
           permission: permissionToGrant
       }
   }
}
...
```

user.projection.js:

```js
...
[PERMISSION_GRANTED]: (state, {payload: {permission}}) => ({
    ...state,
    permissions: [...state.permissions, permission]
})
...
```

Read side. "users" read model:
users.projection.js:

```js
...
[PERMISSION_GRANTED]: async (store, {aggregateId, payload:{permission}}) => {
    const user = await store.findOne('Users', { id: aggregateId })
    if (user) {
        await store.update(
          'Users',
          { id: aggregateId },
          { $set: {permissions: [...user.permissions, permission]}}
        )
    }
}
...
```

users.resolvers.js:

```js
...
userById: async(store, {id}) => store.findOne('Users', {id})
...
```

Now, upon login you can query Users read model and store user record with its permissions in the JWT Token:

```js
...
const user = await resolve.executeQuery({
  modelName: 'Users',
  resolverName: 'userById',
  resolverArgs: { id }
})
if (user)
  return jwt.sign(user, jwtSecret)
...
```

## Using JWT for Command and Query Authorization

Every command and query handler accepts a JSON Web Token (JWT) obtained during the authentication process. This JWT contains an object that was returned by authentication function, or an empty object `{}` if current user is not logged in.

A JWT is signed, so it cannot be forged by an attacker, without knowing a secret that was used for token creation. The token can be decoded and verified using the same secret that was used for its creation:

```js
const { id: userId } = jwt.verify(jwtToken, jwtSecret)
```

You can store any information in a JWT. For instance, during authentication, you can look up a
user's permissions and add them to the token. Then, you can check for the user's permissions on a command or query execution as shown below:

```js
const { id: userId, permissions } = jwt.verify(jwtToken, jwtSecret);

if (permissions && permissions.includes("admin")) {
...
} else {
    throw new Error("Access denied");
}
```
