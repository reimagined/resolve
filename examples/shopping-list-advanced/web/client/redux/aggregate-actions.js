import { sendAggregateAction } from 'resolve-redux'

export const createShoppingList = sendAggregateAction.bind(
  null,
  'ShoppingList',
  'createShoppingList'
)
export const renameShoppingList = sendAggregateAction.bind(
  null,
  'ShoppingList',
  'renameShoppingList'
)
export const removeShoppingList = sendAggregateAction.bind(
  null,
  'ShoppingList',
  'removeShoppingList'
)
export const createShoppingItem = sendAggregateAction.bind(
  null,
  'ShoppingList',
  'createShoppingItem'
)
export const toggleShoppingItem = sendAggregateAction.bind(
  null,
  'ShoppingList',
  'toggleShoppingItem'
)
export const removeShoppingItem = sendAggregateAction.bind(
  null,
  'ShoppingList',
  'removeShoppingItem'
)
export const shareShoppingListForUser = sendAggregateAction.bind(
  null,
  'ShoppingList',
  'shareShoppingListForUser'
)
export const unshareShoppingListForUser = sendAggregateAction.bind(
  null,
  'ShoppingList',
  'unshareShoppingListForUser'
)

export const createUser = sendAggregateAction.bind(null, 'User', 'createUser')
export const updateUserName = sendAggregateAction.bind(
  null,
  'User',
  'updateUserName'
)
