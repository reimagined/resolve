---
id: store
title: Store
description: This document describes functions that you can use to communicate with a Read Model store through a `store` object.
---

:::info TypeScript Support

A read model store has an associated TypeScript type:

- Type Name - `ResolveStore`
- Package - `@resolve-js/readmodel-base`

:::

The table below lists functions that you can use to communicate with a read model store through a `store` object.

| Function Name               | Description                                        |
| --------------------------- | -------------------------------------------------- |
| [defineTable](#definetable) | Defines a new table within the store.              |
| [find](#find)               | Searches for data items.                           |
| [findOne](#findone)         | Searches for a single data item.                   |
| [count](#count)             | Returns the number of items that meet a condition. |
| [insert](#insert)           | Inserts an item into a table.                      |
| [update](#update)           | Updates data items.                                |
| [delete](#delete)           | Deletes data items.                                |

### defineTable

Defines a new table within the store.

#### Arguments

| Argument Name    | Description                                       |
| ---------------- | ------------------------------------------------- |
| tableName        | The new table's name.                             |
| tableDeclaration | An object that defines the new table's structure. |

#### Example

```js
Init: async store => {
  await store.defineTable('Stories', {
    indexes: { id: 'string', type: 'string' },
    fields: [
      'title',
      'text',
      'link',
      'commentCount',
      'votes',
      'createdAt',
      'createdBy',
      'createdByName'
    ]
  })
```

### find

Searches for data items based on the specified expression.

#### Arguments

| Argument Name       | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| tableName           | A table name.                                                           |
| searchCondition     | An object that defines a search expression.                             |
| projectionCondition | Defines which fields should be included into the resulting data sample. |
| sortCondition       | Defines how to sort the resulting data sample.                          |
| skip                | A number of data items to skip.                                         |
| limit               | The maximum number of data items to fetch.                              |

#### Example

```js
const getStories = async (type, store, { first, offset }) => {
  try {
    const search = type && type.constructor === String ? { type } : {}
    const skip = first || 0
    const stories = await store.find(
      'Stories',
      search,
      null,
      { createdAt: -1 },
      skip,
      offset
    )
    return Array.isArray(stories) ? stories : []
  } catch (error) {
    ...
    throw error
  }
}
```

The **projection** argument should be an object, in which keys are field names and values are either `1` or `0`:

- 1 - specifies that the field should be included into the resulting data sample;
- 0 - specifies that a field should be excluded from the resulting sample.

The first field in a projection object defines how the projection is interpreted:

- If the first field's value is `1`, the projection works in inclusive mode. In this mode, you only need to specify included fields. All omitted fields are excluded.
- If the first field's value is `0`, the projection works in exclusive mode. In this mode, only excluded fields should be specified explicitly and all omitted fields are included.

#### Example

```js
const findResult = await store.find(
  'TestTable',
  searchCondition,
  { field1: 1, field2: 1, field3: 1 }, // Return the specified fields
  //{ field1: 0, field2: 0, field3: 0 }, // Return all fields except for the specified fields
  { id: sortOrder },
  skip,
  limit
)
```

### findOne

Searches for a data item based on the specified expression.

#### Arguments

| Argument Name       | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| tableName           | A table name.                                                           |
| searchCondition     | An object that defines a search expression.                             |
| projectionCondition | Defines which fields should be included into the resulting data sample. |

#### Example

```js
[STORY_UPVOTED]: async (store, { aggregateId, payload: { userId } }) => {
  const story = await store.findOne(
    'Stories',
    { id: aggregateId },
    { votes: 1 }
  )
  await store.update(
    'Stories',
    { id: aggregateId },
    { $set: { votes: story.votes.concat(userId) } }
  )
},
```

### count

Returns the number of items that meet the specified condition.

#### Arguments

| Argument Name   | Description                                 |
| --------------- | ------------------------------------------- |
| tableName       | A table name.                               |
| searchCondition | An object that defines a search expression. |

#### Example

```js
const getStoryCount = async (type, store) =>
  const count = await store.count('Stories', {})
  return count
}
```

### insert

Inserts an item into the specified table.

#### Arguments

| Argument Name | Description                          |
| ------------- | ------------------------------------ |
| tableName     | A table name.                        |
| document      | An object that is an item to insert. |

#### Example

```js
[STORY_CREATED]: async (
    store, { aggregateId, timestamp, payload: { title, link, userId, userName, text } }
  ) => {
    const isAsk = link == null || link === ''
    const type = isAsk ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

    const story = {
      id: aggregateId,
      type,
      title,
      text,
      link: !isAsk ? link : '',
      commentCount: 0,
      votes: [],
      createdAt: timestamp,
      createdBy: userId,
      createdByName: userName
    }

    await store.insert('Stories', story)
  },
```

### update

Searches for data items and updates them based on the specified update expression.

#### Arguments

| Argument Name   | Description                                            |
| --------------- | ------------------------------------------------------ |
| tableName       | The name of the table to update.                       |
| searchCondition | An object that defines a search expression.            |
| updateCondition | An object that defines an update expression.           |
| updateOptions   | Specifies additional options for the update operation. |

#### Example

```js
[STORY_UPVOTED]: async (store, { aggregateId, payload: { userId } }) => {
  const story = await store.findOne(
    'Stories',
    { id: aggregateId },
    { votes: 1 }
  )
  await store.update(
    'Stories',
    { id: aggregateId },
    { $set: { votes: story.votes.concat(userId) } }
  )
},
```

### delete

Deletes data items based on the specified search expression.

#### Arguments

| Argument Name   | Description                                 |
| --------------- | ------------------------------------------- |
| tableName       | A table name.                               |
| searchCondition | An object that defines a search expression. |

#### Example

```js
[SHOPPING_LIST_REMOVED]: async (store, { aggregateId }) => {
  await store.delete('ShoppingLists', { id: aggregateId })
}
```

### Search Expression Operators

Search expressions use operators to compare values and group expression clauses.

The following operators are supported:

**Comparison operators:**

| Operator | Description                                                           |
| -------- | --------------------------------------------------------------------- |
| \$eq     | Matches values that are equal to the specified value.                 |
| \$ne     | Matches values that are not equal to the specified value.             |
| \$lt     | Matches values that are less than the specified value.                |
| \$lte    | Matches values that are less than or equal to the specified values.   |
| \$gt     | Matches values that are greater than the specified value.             |
| \$gte    | Matches values that are greater than or equal to the specified value. |

**Logical Operators:**

| Operator | Description                                      |
| -------- | ------------------------------------------------ |
| \$and    | Joins two expressions with an AND operation.     |
| \$or     | Joins two expressions with an OR operation.      |
| \$not    | Applies a NOT operation to invert an expression. |

#### Example

```js
const data = await store.find('Entries', {
  $or: [
    { $and: [{ name: 'Second entry', id: 'id-2' }] },
    { $not: { id: { $gte: 'id-1' } } },
  ],
})
```
