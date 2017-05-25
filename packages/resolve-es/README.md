# `resolve-es`

This package serves as an event storage with an driver specifying where to store events. The following drivers are available for this package:
- [resolve-es-file](https://github.com/reimagined/resolve/tree/master/packages/resolve-es-file) – to store events using a file
- [resolve-es-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-es-memory) - to store events using memory
- [resolve-es-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-es-mongo) -  to store events using MongoDB

## Usage

```js
import createEs from 'resolve-es';
import createDriver from 'resolve-es-memory';

const driver = createDriver();
const es = createEs({ driver });

const event = {
    type: 'UserCreated',
    payload: {
        email: 'test@user.com'
    }
};

es.onEventSaved(e =>
    console.log('Event saved', e)
);

es.saveEvent(event);
```
