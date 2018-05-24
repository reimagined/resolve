import { expect } from 'chai';
import sinon from 'sinon';

import createReadModel from '../src/read-model';

describe('resolve-query read-model', () => {
  let eventStore, readStore, adapter, projection, unsubscriber;
  let primaryEvents, secondaryEvents, resolveSecondaryEvents;

  const INIT_TIME = 1000;

  const skipTicks = () =>
    new Promise(resolve =>
      Promise.resolve().then(() => process.nextTick(resolve))
    );

  beforeEach(() => {
    void ([primaryEvents, secondaryEvents] = [[], []]);
    const secondaryEventsPromise = new Promise(
      resolve => (resolveSecondaryEvents = resolve)
    );
    const projectionLog = [];
    unsubscriber = sinon.stub();

    const processEvents = async (
      eventsList,
      eventTypes,
      callback,
      startTime
    ) => {
      for (let event of eventsList) {
        if (
          event &&
          eventTypes.indexOf(event.type) > -1 &&
          event.timestamp >= startTime
        ) {
          callback(event);
          await skipTicks();
        }
      }
    };

    eventStore = {
      subscribeByEventType: sinon
        .stub()
        .callsFake((eventTypes, callback, { startTime }) => {
          const primaryEventPromise = processEvents(
            primaryEvents,
            eventTypes,
            callback,
            startTime
          );

          primaryEventPromise
            .then(() => secondaryEventsPromise)
            .then(
              processEvents.bind(
                null,
                secondaryEvents,
                eventTypes,
                callback,
                startTime
              )
            );

          return primaryEventPromise.then(() => unsubscriber);
        })
    };

    readStore = { touch: async event => projectionLog.push(event) };

    adapter = {
      buildProjection: sinon.stub().callsFake(inputProjection =>
        Object.keys(inputProjection).reduce((acc, key) => {
          acc[key] = sinon
            .stub()
            .callsFake(
              async event => await inputProjection[key](readStore, event)
            );
          return acc;
        }, {})
      ),

      init: sinon.stub().callsFake(() => ({
        prepareProjection: sinon.stub().callsFake(async () => INIT_TIME),
        getReadInterface: sinon.stub().callsFake(async () => projectionLog)
      })),

      reset: sinon.stub().callsFake(async () => null)
    };

    projection = {
      GoodEvent: sinon
        .stub()
        .callsFake(async (store, event) => await store.touch(event)),
      BadEvent: sinon.stub().callsFake(async () => {
        throw new Error('BadEvent');
      }),
      FailedEvent: true
    };
  });

  afterEach(() => {
    primaryEvents = null;
    secondaryEvents = null;
    resolveSecondaryEvents = null;
    eventStore = null;
    unsubscriber = null;
    readStore = null;
    adapter = null;
    projection = null;
  });

  it('should init correctly projection and adapter, and provide proper API', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });

    expect(adapter.buildProjection.callCount).to.be.equal(1);
    expect(adapter.buildProjection.firstCall.args[0]).to.be.equal(projection);

    expect(projection.GoodEvent.callCount).to.be.equal(0);
    expect(projection.BadEvent.callCount).to.be.equal(0);

    const builtProjection = adapter.buildProjection.firstCall.returnValue;
    const fakeEvent = { timestamp: 10 };

    await builtProjection.GoodEvent(fakeEvent);
    expect(projection.GoodEvent.callCount).to.be.equal(1);
    expect(projection.GoodEvent.firstCall.args[0]).to.be.equal(readStore);
    expect(projection.GoodEvent.firstCall.args[1]).to.be.equal(fakeEvent);

    try {
      await builtProjection.BadEvent(fakeEvent);
      return Promise.reject('Event failure should be passed from projection');
    } catch (err) {
      expect(projection.BadEvent.callCount).to.be.equal(1);
      expect(projection.BadEvent.firstCall.args[0]).to.be.equal(readStore);
      expect(projection.BadEvent.firstCall.args[1]).to.be.equal(fakeEvent);
    }

    expect(readModel.read).to.be.a('function');
    expect(readModel.dispose).to.be.a('function');
  });

  it('should provide read API witn on-demand build with success', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });
    const builtProjection = adapter.buildProjection.firstCall.returnValue;
    const appliedPromise = new Promise(resolve => {
      projection.GoodEvent.onCall(3).callsFake(async (store, event) => {
        await store.touch(event);
        resolve();
      });
    });

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ];
    secondaryEvents = [
      {
        type: 'GoodEvent',
        timestamp: INIT_TIME - 10,
        payload: 'SECONDARY(-10)'
      },
      {
        type: 'GoodEvent',
        timestamp: INIT_TIME + 30,
        payload: 'SECONDARY(+30)'
      },
      {
        type: 'GoodEvent',
        timestamp: INIT_TIME + 40,
        payload: 'SECONDARY(+40)'
      }
    ];

    const firstResult = await readModel.getReadInterface();
    expect(firstResult.length).to.be.equal(2);
    expect(firstResult[0]).to.be.equal(primaryEvents[1]);
    expect(firstResult[1]).to.be.equal(primaryEvents[2]);

    expect(builtProjection.GoodEvent.callCount).to.be.equal(2);

    resolveSecondaryEvents();
    await appliedPromise;

    const secondResult = await readModel.getReadInterface();
    expect(secondResult.length).to.be.equal(4);
    expect(secondResult[0]).to.be.equal(primaryEvents[1]);
    expect(secondResult[1]).to.be.equal(primaryEvents[2]);
    expect(secondResult[2]).to.be.equal(secondaryEvents[1]);
    expect(secondResult[3]).to.be.equal(secondaryEvents[2]);

    expect(builtProjection.GoodEvent.callCount).to.be.equal(4);
  });

  it('should provide read API and perform adapter init only once', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });
    const builtProjection = adapter.buildProjection.firstCall.returnValue;

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ];

    expect(adapter.init.callCount).to.be.equal(0);
    const firstResult = await readModel.getReadInterface();
    const secondResult = await readModel.getReadInterface();

    expect(firstResult.length).to.be.equal(2);
    expect(firstResult[0]).to.be.equal(primaryEvents[1]);
    expect(firstResult[1]).to.be.equal(primaryEvents[2]);

    expect(secondResult.length).to.be.equal(2);
    expect(secondResult[0]).to.be.equal(primaryEvents[1]);
    expect(secondResult[1]).to.be.equal(primaryEvents[2]);

    expect(builtProjection.GoodEvent.callCount).to.be.equal(2);

    expect(adapter.init.callCount).to.be.equal(1);
  });

  it('should provide read API and handle failure on storage events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });
    const builtProjection = adapter.buildProjection.firstCall.returnValue;

    primaryEvents = [
      { type: 'BadEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' }
    ];

    const lastState = await readModel.getReadInterface();
    const lastError = await readModel.getLastError();

    expect(builtProjection.BadEvent.callCount).to.be.equal(1);
    const adapterApi = adapter.init.firstCall.returnValue;
    expect(adapterApi.getReadInterface.callCount).to.be.equal(1);

    expect(lastError).to.be.instanceOf(Error);
    expect(lastError.message).to.be.equal('BadEvent');

    const actualState = await adapterApi.getReadInterface();
    expect(lastState).to.be.equal(actualState);
  });

  it('should provide read API and handle failure on bus events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });
    const builtProjection = adapter.buildProjection.firstCall.returnValue;
    const appliedPromise = new Promise(resolve => {
      projection.BadEvent.onCall(0).callsFake(async () => {
        skipTicks().then(resolve);
        throw new Error('BadEvent');
      });
    });

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' }
    ];
    secondaryEvents = [
      { type: 'BadEvent', timestamp: INIT_TIME + 40, payload: 'SECONDARY(+40)' }
    ];

    await readModel.getReadInterface();
    await readModel.getLastError();

    resolveSecondaryEvents();
    await appliedPromise;

    const lastState = await readModel.getReadInterface();
    const lastError = await readModel.getLastError();

    expect(builtProjection.BadEvent.callCount).to.be.equal(1);
    const adapterApi = adapter.init.firstCall.returnValue;
    expect(adapterApi.getReadInterface.callCount).to.be.equal(2);

    expect(lastError).to.be.instanceOf(Error);
    expect(lastError.message).to.be.equal('BadEvent');

    const actualState = await adapterApi.getReadInterface();
    expect(lastState).to.be.equal(actualState);
  });

  it('should handle error in projection flow for storage events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });

    const builtProjection = adapter.buildProjection.firstCall.returnValue;
    builtProjection.FailedEvent = sinon.stub().callsFake(async () => {
      throw new Error('Internal failure');
    });

    primaryEvents = [
      {
        type: 'FailedEvent',
        timestamp: INIT_TIME + 10,
        payload: 'PRIMARY(+10)'
      },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ];

    await readModel.getReadInterface();
    const lastError = await readModel.getLastError();

    expect(lastError).to.be.instanceOf(Error);
    expect(lastError.message).to.be.equal('Internal failure');
  });

  it('should handle error in projection flow for bus events', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });
    const builtProjection = adapter.buildProjection.firstCall.returnValue;

    const appliedPromise = new Promise(
      resolve =>
        (builtProjection.FailedEvent = sinon.stub().callsFake(async () => {
          skipTicks().then(resolve);
          throw new Error('Internal failure');
        }))
    );

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' }
    ];

    secondaryEvents = [
      {
        type: 'FailedEvent',
        timestamp: INIT_TIME + 20,
        payload: 'PRIMARY(+20)'
      }
    ];

    await readModel.getReadInterface();
    resolveSecondaryEvents();
    await appliedPromise;

    const lastError = await readModel.getLastError();
    expect(lastError).to.be.instanceOf(Error);
    expect(lastError.message).to.be.equal('Internal failure');
  });

  it('should handle error in subscribe init phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });

    adapter.init.onCall(0).callsFake(() => ({
      prepareProjection: sinon.stub().callsFake(async () => {
        throw new Error('Prepare projection error');
      }),
      getReadInterface: sinon.stub()
    }));

    await readModel.getReadInterface();
    const lastError = await readModel.getLastError();

    expect(lastError).to.be.instanceOf(Error);
    expect(lastError.message).to.be.equal('Prepare projection error');
  });

  it('should work fine with default zero value as initial last timestamp', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });

    adapter.init.onCall(0).callsFake(() => ({
      getReadInterface: sinon.stub()
    }));

    const result = await readModel.getReadInterface();
    const adapterApi = adapter.init.firstCall.returnValue;
    const readValue = await adapterApi.getReadInterface.firstCall.returnValue;

    expect(result).to.be.equal(readValue);
  });

  it('should work fine with default adapter', async () => {
    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ];
    const appliedEvents = [];

    const projection = {
      GoodEvent: (_, event) => appliedEvents.push(event)
    };

    const readModel = createReadModel({ projection, eventStore });
    await readModel.getReadInterface();

    expect(appliedEvents).to.be.deep.equal(primaryEvents);
  });

  it('should work fine without projection function', async () => {
    const readModel = createReadModel({ eventStore, adapter });
    const result = await readModel.getReadInterface();

    const adapterApi = adapter.init.firstCall.returnValue;
    const readValue = await adapterApi.getReadInterface.firstCall.returnValue;

    expect(result).to.be.equal(readValue);
  });

  it('should support dispose on initial phase', async () => {
    const readModel = createReadModel({ eventStore, adapter });
    readModel.dispose();

    expect(adapter.reset.callCount).to.be.equal(0);
  });

  it('should support dispose due store events loading phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ];

    const readPromise = readModel.getReadInterface();
    await readModel.dispose();
    await readPromise;

    expect(adapter.reset.callCount).to.be.equal(1);
    expect(unsubscriber.callCount).to.be.equal(1);
  });

  it('should support dispose after store events loading phase', async () => {
    const readModel = createReadModel({ projection, eventStore, adapter });

    primaryEvents = [
      { type: 'GoodEvent', timestamp: INIT_TIME - 10, payload: 'PRIMARY(-10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 10, payload: 'PRIMARY(+10)' },
      { type: 'GoodEvent', timestamp: INIT_TIME + 20, payload: 'PRIMARY(+20)' }
    ];

    await readModel.getReadInterface();
    await readModel.dispose();

    expect(adapter.reset.callCount).to.be.equal(1);
    expect(unsubscriber.callCount).to.be.equal(1);
  });
});
