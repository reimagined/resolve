import createDefaultAdapter from 'resolve-readmodel-memory';
import { diff } from 'diff-json';

const emptyFunction = () => {};

const [diffWrapperPrev, diffWrapperNext] = [{ wrap: null }, { wrap: null }];

const init = async repository => {
  const { adapter, eventStore, projection } = repository;
  if (projection === null) {
    Object.assign(repository, adapter.init(), {
      loadDonePromise: Promise.resolve(),
      onDispose: emptyFunction
    });
    return;
  }

  const { prepareProjection = () => 0, ...readApi } = adapter.init();
  let unsubscriber = null;

  let onDispose = () => {
    if (unsubscriber === null) {
      onDispose = emptyFunction;
      return;
    }
    unsubscriber();
  };

  const loadDonePromise = new Promise((resolve, reject) => {
    let flowPromise = Promise.resolve();

    const forceStop = (reason, chainable = true) => {
      if (flowPromise) {
        flowPromise.catch(reject);
        flowPromise = null;
        onDispose();
      }

      repository.lateFailure = reason;
      if (chainable) {
        return Promise.reject(reason);
      }

      reject(reason);
    };

    const projectionInvoker = async event =>
      await projection[event.type](event);

    const eventListenerInvoker = async event =>
      typeof repository.eventListener === 'function'
        ? await repository.eventListener(event)
        : null;

    const synchronizedEventWorker = event =>
      (flowPromise = flowPromise
        ? flowPromise
            .then(projectionInvoker.bind(null, event))
            .then(eventListenerInvoker.bind(null, event))
            .catch(forceStop)
        : flowPromise);

    Promise.resolve()
      .then(prepareProjection)
      .then(startTime =>
        eventStore.subscribeByEventType(
          Object.keys(projection),
          synchronizedEventWorker,
          {
            startTime
          }
        )
      )
      .then(unsub => {
        if (flowPromise) {
          flowPromise = flowPromise.then(resolve).catch(forceStop);
        }

        if (onDispose !== emptyFunction) {
          unsubscriber = unsub;
        } else {
          unsub();
        }
      })
      .catch(err => forceStop(err, false));
  });

  Object.assign(repository, readApi, {
    loadDonePromise,
    onDispose
  });
};

const getReadInterface = async repository => {
  if (!repository.hasOwnProperty('loadDonePromise')) {
    init(repository);
  }

  try {
    await repository.loadDonePromise;
  } catch (err) {}

  try {
    return await repository.getReadInterface();
  } catch (err) {
    return null;
  }
};

const getLastError = async repository => {
  if (!repository.loadDonePromise) return null;

  try {
    await repository.loadDonePromise;
  } catch (error) {
    return error;
  }

  if (repository.hasOwnProperty('lateFailure')) {
    return repository.lateFailure;
  }

  return null;
};

const read = async (repository, resolverName, resolverArgs) => {
  const resolver = (repository.resolvers || {})[resolverName];

  if (typeof resolver !== 'function') {
    throw new Error(
      `The '${resolverName}' resolver is not specified or not function`
    );
  }

  const store = await getReadInterface(repository);
  return await resolver(store, resolverArgs);
};

const dispose = repository => {
  if (repository.disposePromise) {
    return repository.disposePromise;
  }

  const disposePromise = Promise.resolve([
    repository.onDispose,
    repository.adapter.reset
  ]).then(async ([onDispose, reset]) => {
    await onDispose();
    await reset();
  });

  Object.keys(repository).forEach(key => {
    delete repository[key];
  });

  repository.disposePromise = disposePromise;
  return repository.disposePromise;
};

const addEventListener = (repository, callback) => {
  if (typeof callback !== 'function') return;
  repository.externalEventListeners.push(callback);
};

const removeEventListener = (repository, callback) => {
  if (typeof callback !== 'function') return;
  const idx = repository.externalEventListeners.findIndex(
    cb => callback === cb
  );
  if (idx < 0) return;
  repository.externalEventListeners.splice(idx, 1);
};

const makeReactiveReader = async (
  repository,
  publisher,
  resolverName,
  resolverArgs = {}
) => {
  if (typeof publisher !== 'function') {
    throw new Error(
      'Publisher should be callback function (diff: Object) => void'
    );
  }

  let result = await read(repository, resolverName, resolverArgs);
  let flowPromise = Promise.resolve();

  const eventHandler = async () => {
    if (!flowPromise) return;

    const actualResult = await read(repository, resolverName, resolverArgs);
    void ([diffWrapperPrev.wrap, diffWrapperNext.wrap] = [
      result,
      actualResult
    ]);

    const difference = diff(diffWrapperPrev, diffWrapperNext);
    result = actualResult;

    await publisher(difference);
  };

  const eventListener = event =>
    (flowPromise = flowPromise.then(eventHandler.bind(null, event)));
  addEventListener(repository, eventListener);

  const forceStop = () => {
    if (!flowPromise) return;
    removeEventListener(repository, eventListener);
    flowPromise = null;
  };

  return { result, forceStop };
};

const createReadModel = ({
  adapter = createDefaultAdapter(),
  projection,
  eventStore,
  resolvers
}) => {
  const repository = {
    projection: projection ? adapter.buildProjection(projection) : null,
    externalEventListeners: [],
    eventListener: event =>
      repository.externalEventListeners.forEach(callback =>
        Promise.resolve().then(callback.bind(null, event))
      ),
    onDispose: () => null,
    adapter,
    eventStore,
    resolvers
  };

  return Object.freeze({
    makeReactiveReader: makeReactiveReader.bind(null, repository),
    getReadInterface: getReadInterface.bind(null, repository),
    getLastError: getLastError.bind(null, repository),
    read: read.bind(null, repository),
    dispose: dispose.bind(null, repository)
  });
};

export default createReadModel;
