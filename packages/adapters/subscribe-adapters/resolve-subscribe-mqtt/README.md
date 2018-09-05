# **resolve-subscribe-mqtt**
[![npm version](https://badge.fury.io/js/resolve-subscribe-mqtt.svg)](https://badge.fury.io/js/resolve-subscribe-mqtt)

This package is a `resolve-redux` adapter used to subscribe to events via an [MQTT](https://github.com/mqttjs/MQTT.js) protocol.


#### Client Side
```js
import createClientAdapter from 'resolve-subscribe-mqtt';

(async () => {
  const adapter = createClientAdapter({ origin, rootPath, url, appId, onEvent })
  
  await adapter.init()
})() 
```

#### Server Side
```js
import createServerAdapter from 'resolve-subscribe-mqtt';

(async () => {
  const adapter = createServerAdapter({ server, getRootBasedUrl, pubsubManager, appId })
  
  await adapter.init()
})() 
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-subscribe-mqtt-readme?pixel)
