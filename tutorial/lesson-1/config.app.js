const appConfig = {
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: "common/aggregates/shopping_list.projection.js"
    }
  ]
}
export default appConfig
