# Setting up Authentication

# Using 3rd Party Auth Services

# Making Your Own User Registry

# Using JWT Tokens for C and Q Authorization

Every command and query handler accepts a JWT Token that was obtained during authentication process.

JWT Token contains an object that was returned by authentication function, or an empty object `{}` if current user is not logged in.
JWT Token is signed, so it cannot be forged by attacker, without knowing a secret that was used on token creation.

JWT Token can be decoded and verified using the same secret that was used on its creation:

```js
const { id: userId } = jwt.verify(jwtToken, jwtSecret);
```

You can store any information you need in JWT Token. For instance, during authentication, you can look up
user's rights and store them in the token. Then you can check for user's rights on command or query execution like this:

```js
  const { id: userId, rights } = jwt.verify(jwtToken, jwtSecret);

  if (rights && rights.includes("admin")) {
      ...
  } else {
      throw new Error("Access denied");
  }
```
