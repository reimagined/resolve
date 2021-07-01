import { ReadModel, ReadModelNotificationDispatcher } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
import {
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_REMOVED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_LIST_RENAMED,
} from '../event-types'

const notifyChannelAllLists = async (
  store: ResolveStore,
  dispatchNotification: ReadModelNotificationDispatcher
) => {
  const lists = await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  await dispatchNotification('all-lists', lists)
}

const projection: ReadModel<ResolveStore> = {
  Init: async (store) => {
    await store.defineTable('ShoppingLists', {
      indexes: {
        id: 'string',
      },
      fields: ['createdAt', 'name', 'items'],
    })
  },

  [SHOPPING_LIST_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } },
    { dispatchNotification }
  ) => {
    const shoppingList = {
      id: aggregateId,
      name,
      createdAt: timestamp,
      items: [],
    }

    await store.insert('ShoppingLists', shoppingList)
    await notifyChannelAllLists(store, dispatchNotification)
  },

  [SHOPPING_LIST_REMOVED]: async (
    store,
    { aggregateId },
    { dispatchNotification }
  ) => {
    await store.delete('ShoppingLists', { id: aggregateId })
    await notifyChannelAllLists(store, dispatchNotification)
  },

  [SHOPPING_LIST_RENAMED]: async (
    store,
    { aggregateId, payload: { name } },
    { dispatchNotification }
  ) => {
    await store.update('ShoppingLists', { id: aggregateId }, { $set: { name } })
    await notifyChannelAllLists(store, dispatchNotification)
  },

  [SHOPPING_ITEM_CREATED]: async (
    store,
    { aggregateId, payload: { id, text } },
    { dispatchNotification }
  ) => {
    const item = {
      id,
      text,
      checked: false,
    }

    const { items } = await store.findOne('ShoppingLists', { id: aggregateId })
    items.push(item)
    await store.update(
      'ShoppingLists',
      { id: aggregateId },
      { $set: { items } }
    )

    await dispatchNotification(`list-${aggregateId}`, {
      type: 'ItemCreated',
      payload: item,
    })
  },

  [SHOPPING_ITEM_TOGGLED]: async (
    store,
    { aggregateId, payload: { id } },
    { dispatchNotification }
  ) => {
    const { items } = await store.findOne('ShoppingLists', { id: aggregateId })

    const item = items.find((s) => s.id === id)
    item.checked = !item.checked
    await store.update(
      'ShoppingLists',
      { id: aggregateId },
      { $set: { items } }
    )

    await dispatchNotification(`list-${aggregateId}`, {
      type: 'ItemToggled',
      payload: item,
    })
  },

  [SHOPPING_ITEM_REMOVED]: async (
    store,
    { aggregateId, payload: { id } },
    { dispatchNotification }
  ) => {
    const { items } = await store.findOne('ShoppingLists', { id: aggregateId })

    await store.update(
      'ShoppingLists',
      { id: aggregateId },
      { $set: { items: items.filter((s) => s.id !== id) } }
    )

    await dispatchNotification(`list-${aggregateId}`, {
      type: 'ItemRemoved',
      payload: {
        id,
      },
    })
  },
}

export default projection
