---
id: curl
title: Standard HTTP API
---

This document demonstrates how to use the HTTP API to communicate with a reSolve backend. To test the provided console inputs on your machine, download and run the [Shopping List](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) example project.

1. Create a new shopping list named "List 1":

```sh
$ curl -i http://localhost:3000/api/commands/ \
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


HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Tue, 02 Oct 2018 11:47:53 GMT
Connection: keep-alive

OK
```

2. Query a View Model to see the shopping list:

```sh
$ curl -i -g -X GET "http://localhost:3000/api/query/ShoppingList/12345-new-shopping-list"

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 58
ETag: W/"3a-jyqRShDvCZnc9uCOPi31BlQFznA"
Date: Tue, 02 Oct 2018 12:11:43 GMT
Connection: keep-alive

{"id":"12345-new-shopping-list","name":"List 1","list":[]}
```

3. Add an item to the shopping list:

```sh
$ curl -i http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "12345-new-shopping-list",
    "type": "createShoppingItem",
    "payload": {
        "id": "1",
        "text": "Beer"
    }
}
'

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Tue, 02 Oct 2018 12:13:39 GMT
Connection: keep-alive

OK
```

4. Add another item:

```sh
$ curl -i http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "12345-new-shopping-list",
    "type": "createShoppingItem",
    "payload": {
        "id": "2",
        "text": "Chips"
    }
}
'
```

5. Now you can query the view model again and see the items you have added:

```sh
$ curl --g -X GET "http://localhost:3000/api/query/ShoppingList/12345-new-shopping-list" '
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 140
ETag: W/"8c-rWsIpzFOfkV3y9g6x9FlenTaG/A"
Date: Tue, 02 Oct 2018 12:17:57 GMT
Connection: keep-alive

{"id":"12345-new-shopping-list","name":"List 1","list":[{"id":"1","text":"Beer","checked":false},{"id":"2","text":"Chips","checked":false}]}
```

Below you can see the newly created list and its items on the Shopping List application's page.

![List1-items](assets/curl/list1-items.png)
