# `resolve-es`

This package serves as an event store with adapter storing behavior.

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
