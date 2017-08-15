What I would like to see here:

- Domain aggregates - at least one file for aggregate - with command and event definition (for static and dynamic validation) and a business logic.
- "Command side" entry point (in aggregates/index.js?) - code that handles incoming command and dispatches it particular aggregate instance.
- Read/view models - at least one file per read model - with event handling projection/reducer functions. 
- "Query side" entry point - a code that handles incoming query
- UI/client app folder, inside this folder i would like to see a typical react-redux-graphql app that we don't need to explain. All resolve-specific things should be provided by library and HOC, not by lot of code.
- static files folder
- server code which basically run express with C and/or Q handlers middleware (and server rendering) - it should not depend on aggregates! It expected to be changed only if somebody wants to add custom handlers.
- config.js code that sets up drivers for eventstore/bus, read models etc. Probably it should explicitly contain config.dev.js and config.prod.js
- tests. Not sure if all tests should be separate - unit tests are easier to find if they are next to source files

Don't forget about CQRS - С and Q should ideally be a separate things, maybe even separate servers projects. 
At very minimum they should be able to run in different instances one handling commands, and another - queries.

Don't forget for read model that can serve query by itself - like elasticsearch or reporting SQL database

ToDo app - where did you get such weird code? There is a perfect example: https://github.com/reactjs/redux/tree/master/examples/todos - with good English and good design. Your implementation is worse, not clean.



