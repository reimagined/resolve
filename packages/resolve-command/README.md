# **📢 resolve-command** [![npm version](https://badge.fury.io/js/resolve-command.svg)](https://badge.fury.io/js/resolve-command)

Provides a function to handle a command and send the generated event to an [event store](https://github.com/reimagined/resolve/tree/master/packages/resolve-es) based on definitions of [aggregates](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models) and their commands. 

## Usage
When initializing a command, pass the following arguments:

* `eventStore`
	Configured [eventStore](https://github.com/reimagined/resolve/tree/master/packages/resolve-es) instance
	
* `aggregates`
	Array of [aggregates](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models)  

After the command is initialized, you get a function that is used to send an event to the event store. It receives two arguments:
* `command`
	An object with the following fields:
	* `aggregateId` - unique id of aggregate
	* `aggregateName` - name of aggregate that has to handle command
	* `type` - command type
	
	A command may also have some additional payload.

 * `getJwt` 
   Callback for retrieve actual client state stored in verified JWT token.

### Example
```js
import commandHandler from 'resolve-command'
import createEsStorage from 'resolve-storage-memory'
import createBusDriver from 'resolve-bus-memory'
import createEventStore from 'resolve-es'

const aggregates = [{
  name: 'User',
  initialState: {},
  eventHandlers: {
    UserCreated: (state, { name, email}) => ({
      ...state,
      name,
      email
    })
  },
  commands: {
    create: (state, { aggregateId, name, email}) => ({
      type: 'UserCreated',
      aggregateId,
      name,
      email
    })
  }
}]

const eventStore = createEventStore({ storage: createEsStorage(), bus: createBusDriver() })

eventStore.onEvent(['UserCreated'], event =>
  console.log('Event emitted', event)
)

const execute = commandHandler({
  eventStore,
  aggregates
})

const command = {
  aggregateId: '1',
  aggregateName: 'User',
  type: 'create',
  name: 'User Name',
  email: 'test@user.com'
}

execute(command).then(event => {
  console.log('Event saved', event);
})
```
