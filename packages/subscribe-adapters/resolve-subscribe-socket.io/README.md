# **resolve-subscribe-socket.io**
[![npm version](https://badge.fury.io/js/resolve-subscribe-socket.io.svg)](https://badge.fury.io/js/resolve-subscribe-socket.io)

This package is a `resolve-redux` adapter used to subscribe to events via [Socket.io](https://socket.io/).


#### Client Side
```js
import createClientAdapter from 'resolve-subscribe-socket.io/create_client_adapter';

(async () => {
  const adapter = createClientAdapter({ origin, rootPath, url, appId, onEvent })
  
  await adapter.init()
})() 
```

#### Server Side
```js
import createServerAdapter from 'resolve-subscribe-socket.io/create_server_adapter';

(async () => {
  const adapter = createServerAdapter({ server, getRootBasedUrl, pubsubManager, appId })
  
  await adapter.init()
})() 
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-subscribe-socket.io-readme?pixel)
