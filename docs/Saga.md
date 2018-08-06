# Saga

## What is a Saga?

Saga listens to events and can issue commands based on its state and custom logic. 

Refer to the [Edument CQRS Starter Kit Tutorial](http://www.cqrs.nu/Faq/sagas) for details.

## How to Use?

reSolve stores **Sagas** in the `common/sagas/` folder:

```
📁 resolve-app
    ...
    📁 common
        ...
        📁 sagas
            📄 index.js
            📄 saga1.js
            📄 saga2.js
            ...
```

You should set the path for **Sagas** into [configuration](https://github.com/reimagined/resolve/blob/dev/docs/API%20References.md#configuration-files) file `app.config.json`:

```json
{
    "saga": "common/sagas/index.js"
}
```

A typical `index.js` file structure:

```js
import saga1 from './saga1'
import saga2 from './saga2'

export default [saga1, saga2]
```

Each saga can contain `eventHandlers' and 'cronHandlers' parts. A typical **Saga** file structure:

```js
const saga1 = {
  eventHandlers: {
    EventName: async (event, { resolve }) => {
      await resolve.executeCommand({
        type: 'commandType',
        aggregateName: 'aggregateName',
        payload: { },
        aggregateId
      })
    }
  },
  cronHandlers: {
    '* * * * * *': async ({ resolve }) => {
      await resolve.executeCommand({
        type: 'commandType',
        aggregateName: 'aggregateName',
        aggregateId
      })
    }
  }
}

export default saga1

```

## What's Next?

📑 Available scripts, project structure overview, configuration files and much other useful information are in the [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 To learn more about common building principles of architecture, please look at the [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic.

📑 Learn more about [**Event Store**](./Event%20Store.md).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs-saga?pixel)
