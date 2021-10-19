---
id: authentication-and-authorization
title: Authentication and Authorization
description: You can use reSolve's built-in authentication module to enable authentication in your application.
---

## Setting up Authentication

You can use reSolve's built-in [module](modules.md) (**@resolve-js/module-auth**) to enable authentication in your application. The authentication module uses the [Passport.js](http://www.passportjs.org/) library.

Initialize the authentication module in the application's **run.js** script:

```js
const moduleAuth = resolveModuleAuth([
  {
    name: 'local-strategy',
    createStrategy: 'auth/create_strategy.js',
    logoutRoute: {
      path: 'logout',
      method: 'POST',
    },
    routes: [
      {
        path: 'register',
        method: 'POST',
        callback: 'auth/route_register_callback.js',
      },
      {
        path: 'login',
        method: 'POST',
        callback: 'auth/route_login_callback.js',
      },
    ],
  },
])

const baseConfig = merge(
  defaultResolveConfig,
  appConfig,
  moduleComments,
  moduleAuth
)
```

These setting specify the path to a strategy constructor and HTTP API handlers to handle authentication-related requests (register, login and logout in this example). You can implement a strategy constructor as shown below:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/hacker-news/js/auth/create_strategy.js /^/ /\n$/)
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

This code sample implements a strategy constructor for a **local** authentication strategy. The **createStrategy** constructor takes a set of options defined at runtime and returns modified options.

See the **Hacker News** example project for the full code.

## Using 3rd-Party Auth Services

You can implement authentication via 3rd-party services similarly to how you implement local authentication. To implement authentication for a particular service, use corresponding Passport modules, for example, **passport-google** or **passport-facebook**.

## Storing a User Registry in the Application

You can use the standard event sourcing approach to implement a user registry. This is useful in the following cases:

- You prefer to store a user registry in your application without third-party services.
- You use a third-party authentication service but need to store additional information that is not provided by this service (for example, roles or permissions).

Use the following steps to implement a user registry:

1. Add a User aggregate to accept commands and generate events related to managing a user registry
2. Create a read model and use it to look up a user's information during logging in and add this information to a JWT (JSON Web Token)

For example, you can write the following if you want to grant permissions to a user:

#### Write side - The "user" aggregate

```js
// user.commands.js
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

```js
// user.projection.js
...
[PERMISSION_GRANTED]: (state, {payload: {permission}}) => ({
    ...state,
    permissions: [...state.permissions, permission]
})
...
```

#### Read side - The "users" read model

```js
// users.projection.js
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

```js
// users.resolvers.js
...
userById: async(store, {id}) => store.findOne('Users', {id})
...
```

You can now query a user's read model and add the obtained user information to the JWT payload when they log in:

```js
...
const { data: user } = await resolve.executeQuery({
  modelName: 'Users',
  resolverName: 'userById',
  resolverArgs: { id }
})
if (user)
  return jwt.sign(user, jwtSecret)
...
```

## Using JWT for Command and Query Authorization

Every command and query handler accepts a JSON Web Token (JWT) obtained during the authentication process. This JWT contains an object that the authentication function returned, or an empty object `{}` if the current user is not logged in.

A JWT is signed with a secret to prevent forgery. Use the same secret to decode and verify the token.

```js
const { id: userId } = jwt.verify(token, jwtSecret)
```

You can store any information in a JWT. For instance, you can look up a user's permissions and add them to the token
during authentication. Then, you can check the user's permissions during a command or query execution as shown below:

```js
const { id: userId, permissions } = jwt.verify(token, jwtSecret);

if (permissions && permissions.includes("admin")) {
...
} else {
    throw new Error("Access denied");
}
```
