# Benchmarks

This directory contains benchmark sets for some parts of the reSolve framework.

## Benchmarks for postgresql event store adapter

PostgreSQL related benchmarks use the following environment variables in order to connect to the database:

```sh
export POSTGRES_DATABASE=dbname
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=username
export POSTGRES_PASSWORD=password
```

### Preparing the database

Before running any benchmarks, you must create an event store schema in your database and fill it with events.
To do this, you can import a previously exported (e.g. from cloud) event store.

```
yarn import-eventstore --create=true myeventstore path/to/eventstore-directory
```

### *loadEvents* benchmark

In this benchmark, events are loaded from the database in sequential batches starting at the beginning of the event store and until the end.
The total and average times of batch loading are measured.

Example of running the benchmark:
```
yarn benchmark:load-events --db=myeventstore --eventTypes=EVENT_TYPE1,EVENT_TYPE2
```

The `db` parameter is the name of the PostgreSQL schema in your database.

### *saveEvent* benchmark

In this benchmark, events are sequentially saved to the database.
The total and average times of event saving are measured.

The event types and aggregate distribution as well as the event size and the total number of events are configured via a specification file.
It may be used to fill an event store with specific events, e.g. events that belong to the same aggregate.

The benchmark can be run on an empty event store or on an event store that already contains some events 
(including events from previous benchmark runs).

Example of running the benchmark:
```
yarn benchmark:save-event --db=myeventstore --clear=true --spec=./eventstore/event-spec.example.json
```

#### Options:

* `--clear=true` - clear the event store before running the benchmark.
* `--create=true` - create a new event store.

### Parallel *saveEvent* benchmark

In this benchmark events are saved in parallel by groups, while also having a load operations running in parallel.

```
yarn benchmark:parallel-save --db=myeventstore --clear=true --saveParallel=10 --loadParallel=2
```

#### Options

* `--clear=true` - clear the event store before running the benchmark.
* `--create=true` - create a new event store.
* `--stepCount=<number>` - the number of sequential steps.
* `--saveParallel=<number>` - the number of parallel save operations in one step.
* `--loadParallel=<number>` - the number of parallel load operations in one step.



