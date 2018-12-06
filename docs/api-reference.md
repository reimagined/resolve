---
id: api-reference
title: API reference
---

## Commands
### Command HTTP API
A command can be sent using HTTP API.

For instance, to create a new list in the shopping list app:

```sh
$ curl -X POST http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "12345-new-shopping-list",
    "type": "createShoppingList",
    "payload": {
        "name": "List 1"
    }
}
'
```