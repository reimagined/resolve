# Setting up Authentication

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
  user: async(store, id) => store.findOne('Users', {id})
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
