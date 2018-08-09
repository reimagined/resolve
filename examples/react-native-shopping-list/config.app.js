const appConfig = {
  routes: "web/routes.js",
  staticDir: "web/static",
  distDir: "web/dist",
  redux: {
    reducers: "web/reducers/index.js",
    middlewares: "web/middlewares/index.js",
    store: "web/store/index.js"
  },
  aggregates: [
    {
      name: "ShoppingList",
      commands: "domain/aggregates/shoppingList.commands.js",
      projection: "domain/aggregates/shoppingList.projection.js"
    },
    {
      name: "User",
      commands: "domain/aggregates/user.commands.js",
      projection: "domain/aggregates/user.projection.js"
    }
  ],
  viewModels: [
    {
      name: "ShoppingList",
      projection: "domain/view-models/shoppingList.projection.js"
    }
  ],
  readModels: [
    {
      name: "Default",
      projection: "domain/read-models/default.projection.js",
      resolvers: "domain/read-models/default.resolvers.js"
    }
  ],
  jwtCookie: {
    name: "shopping-list-jwt",
    maxAge: 31536000000
  },
  auth: {
    strategies: "domain/auth/index.js"
  }
}

export default appConfig
