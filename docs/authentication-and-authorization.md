---
id: authentication-and-authorization
title: Authentication and authorization
---

# Setting up Authentication

ReSolve comes with a built-in authentication **[module](./advanced-techniques.md#modules)** ([resolve-module-auth](../packages/modules/resolve-module-auth)) that you can use to enable authentication in your application. The authentication module relies on the [Passport.js](http://www.passportjs.org/) library's functionality.

Create and configure the module in the application's **run.js** script:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/hacker-news/run.js /^[[:blank:]]+const moduleAuth/ /^[[:blank:]]+\)/)
```js
  const moduleAuth = resolveModuleAuth([
    {
      name: 'local-strategy',
      createStrategy: 'auth/create_strategy.js',
      logoutRoute: {
        path: 'logout',
        method: 'POST'
      },
      routes: [
        {
          path: 'register',
          method: 'POST',
          callback: 'auth/route_register_callback.js'
        },
        {
          path: 'login',
          method: 'POST',
          callback: 'auth/route_login_callback.js'
        }
      ]
    }
  ])

  const baseConfig = merge(
    defaultResolveConfig,
    appConfig,
    moduleComments,
    moduleAuth
  )
```

<!-- prettier-ignore-end -->

These setting specify the path to a strategy constructor as well as HTTP API handlers to handle authentication-related requests (register, login and logout in this example). You can implement a strategy constructor as shown below:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/hacker-news/auth/create_strategy.js /^/ /\n$/)
```js
import { Strategy as StrategyFactory } from 'passport-local'

const createStrategy = options => ({
  factory: StrategyFactory,
  options: {
    failureRedirect: error =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: error => `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null,
    ...options
  }
})

export default createStrategy
```

<!-- prettier-ignore-end -->

This code sample demonstrates the implementation of an authentication strategy constructor on the example of a **local** authentication strategy. The createStrategy constructor takes a set of options defined at runtime and returns modified options.

See the [Hacker News](../examples/hacker-news) example project the full code.

# Using 3rd-Party Auth Services

You can implement authentication via 3rd-party services in the same way, in which you implement local authentication. To implement authentication for a particular service, use corresponding Passport modules, e.g., **passport-google** or **passport-facebook**.

# Making Your Own User Registry

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

# Using JWT for Command and Query Authorization

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
