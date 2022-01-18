# Benchmarks

This directory contains benchmark sets for some parts of the reSolve framework.

## Benchmarks for postgresql eventstore adapter

Postgresql related benchmarks use the following environment variables in order to connect to the database:

```sh
export POSTGRES_DATABASE=dbname
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=username
export POSTGRES_PASSWORD=password
```

### Preparing the database

Before running any benchmarks you must create eventstore schema in your database and fill it with events.
For that you can import previously exported (e.g. from cloud) eventstore.

```
yarn import-eventstore --create=true myeventstore path/to/eventstore-directory
```

### *loadEvents* benchmark

In this benchmark events are consequentially loaded by batches from the database from the beginning of the eventstore and until the end.
The total and average times of batch loading are measured.

Example of running the benchmark:
```
yarn benchmark:load-events --db=myeventstore --eventTypes=EVENT_TYPE1,EVENT_TYPE2
```

The `db` parameter is the name of the postgresql schema in your database.

### *saveEvent* benchmark

In this benchmark events are consequentially saved to the database.
The total and average times of event saving are measured.

The event types and aggregate distribution, the event size and the total number of events are configured via specification file.
It may be used to fill eventstore with specific events, e.g. events that belong to the same aggregate.

The benchmark can be run on empty eventstore or on the eventstore that already contains some events 
(including events from the previous benchmark runs).

Example of running the benchmark:
```
yarn benchmark:save-event --db=myeventstore --clear=true --spec=./eventstore/event-spec.example.json
```

The `--clear=true` option is used to clear the eventstore before running the benchmark.

The `--create=true` option is used to create a new eventstore.
