# `resolve-storage`

This package serves as an event storage with a driver specifying where to store events. The following drivers are available for this package:
- [resolve-storage-file](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-file) – to store events using a file
- [resolve-storage-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-memory) - to store events using memory
- [resolve-storage-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-mongo) -  to store events using MongoDB

## Usage

```js
import createStorage from 'resolve-storage';
import createDriver from 'resolve-storage-memory';

const driver = createDriver();
const storage = createStorage({ driver });

const event = {
    type: 'UserCreated',
    payload: {
        email: 'test@user.com'
    }
};

storage.onEventSaved(e =>
    console.log('Event saved', e)
);

storage.saveEvent(event);
```
