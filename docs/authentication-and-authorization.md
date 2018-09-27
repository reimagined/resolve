# Setting up Authentication

[embedmd]:# (../examples/hacker-news/auth/localStrategy.js /const routes = \[/ /\]/) 
```js
const routes = [
  {
    path: '/register',
    method: 'POST',
    callback: async ({ resolve }, username) => {
      const existingUser = await resolve.executeQuery({
        modelName: 'default',
        resolverName: 'user',
        resolverArgs: { name: username.trim() }
      })

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

      return jwt.sign(user, jwtSecret)
    }
  },
  {
    path: '/login',
    method: 'POST',
    callback: async ({ resolve }, username) => {
      const user = await resolve.executeQuery({
        modelName: 'default',
        resolverName: 'user',
        resolverArgs: { name: username.trim() }
      })

      if (!user) {
        throw new Error('No such user')
      }

      return jwt.sign(user, jwtSecret)
    }
  },
  {
    path: '/logout',
    method: 'POST',
    callback: async () => {
      return jwt.sign({}, jwtSecret)
    }
  }
]
```

# Using 3rd Party Auth Services

# Making Your Own User Registry

If you want to store user registry in your application, or if you need to store an additional information about users, not provided by authentication service (like roles or permissions), then you can make User an aggregate, and accept commands, generate events, create read model, and eventually use Users read model during login to look up current user's information and put it into JWT Token.

For example, if you want to grant permissions to user, you can write something like this:

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

Now upon login you can query Users read model and store user record with its permissions in the JWT Token:

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

# Using JWT Tokens for Command and Query Authorization

Every command and query handler accepts a JWT Token that was obtained during authentication process.

JWT Token contains an object that was returned by authentication function, or an empty object `{}` if current user is not logged in.
JWT Token is signed, so it cannot be forged by attacker, without knowing a secret that was used on token creation.

JWT Token can be decoded and verified using the same secret that was used on its creation:

```js
const { id: userId } = jwt.verify(jwtToken, jwtSecret);
```

You can store any information you need in JWT Token. For instance, during authentication, you can look up
user's permissions and store them in the token. Then you can check for user's permissions on command or query execution like this:

```js
  const { id: userId, permissions } = jwt.verify(jwtToken, jwtSecret);

  if (permissions && permissions.includes("admin")) {
      ...
  } else {
      throw new Error("Access denied");
  }
```
