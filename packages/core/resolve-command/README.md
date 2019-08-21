# **resolve-command**
[![npm version](https://badge.fury.io/js/resolve-command.svg)](https://badge.fury.io/js/resolve-command)

Provides a function to handle a command and send the generated event to an [event store](../resolve-es) based on definitions of [aggregates](../resolve-scripts/src/template#aggregates-and-read-models-) and their commands. 

## Usage
When initializing a command, pass the following arguments:

* `eventStore`  
	A configured [eventStore](../resolve-es) instance.
	
* `aggregates`  
	An array of [aggregates](../resolve-scripts/src/template#aggregates-and-read-models-).  

Each aggregate can have optional property `snapshotAdapter` for managing snapshots mechanism. If property had not been passed, snapshots are turned off by default.
Property `snapshotAdapter` receives the adapter for loading and saving intermediate aggregate state.


After the command is initialized, you get a function that is used to send an event to the event store. It receives two arguments:
* `command`
	An object with the following fields:
	* `aggregateId` - a unique aggregate id.
	* `aggregateName` - the name of aggregate that has to handle the command.
	* `type` - the command type.
	* `jwtToken` - non-verified actual JWT token provided from client.

### Example
Define a news handling aggregate (see the  `news-aggregate.js` file), use the `resolve-command` library to execute the `createNews` command and send the corresponding event to the specified event store. To see a read model handling events which this aggregate produces, refer to the [resolve-query](../resolve-query#example) package documentation.

[mdis]:# (../../tests/resolve-command/index.test.js) 
```js
```

##### news-aggregate.js
[mdis]:# (../../tests/resolve-command/news-aggregate.js)
```js
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-command-readme?pixel)
