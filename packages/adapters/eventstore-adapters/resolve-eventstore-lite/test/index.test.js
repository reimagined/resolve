import { ConcurrentError } from 'resolve-eventstore-base';
import createEventstoreAdapter from '../src/index';

const TIMESTAMP_1 = Number.MAX_SAFE_INTEGER - 6;
const TIMESTAMP_2 = Number.MAX_SAFE_INTEGER - 5;
const TIMESTAMP_3 = Number.MAX_SAFE_INTEGER - 4;
const TIMESTAMP_4 = Number.MAX_SAFE_INTEGER - 3;
const TIMESTAMP_5 = Number.MAX_SAFE_INTEGER - 2;
const TIMESTAMP_6 = Number.MAX_SAFE_INTEGER - 1;

// TODO: rewrite tests
describe.skip('resolve-eventstore-lite', () => {
  let eventstoreAdapter = null;

  beforeEach(async () => {
    eventstoreAdapter = createEventstoreAdapter({
      databaseFile: ':memory:',
      eventsTableName: 'eventsTableName',
      snapshotsTableName: 'snapshotsTableName',
    });
    await eventstoreAdapter.init();
  });

  afterEach(async () => {
    await eventstoreAdapter.dispose();
  });

  test('"saveEvent" should save an event with empty payload', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: TIMESTAMP_1,
    });

    let events = [];
    await eventstoreAdapter.loadEvents(
      {
        limit: 1,
      },
      (event) => {
        events.push(event);
      }
    );

    expect(events[0]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      payload: null,
    });
  });

  test('"saveEvent" should save an event', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: TIMESTAMP_1,
      payload: { index: 1 },
    });

    let events = [];
    await eventstoreAdapter.loadEvents({}, (event) => {
      events.push(event);
    });

    expect(events[0]).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      payload: { index: 1 },
    });
  });

  test('"saveEvent" should throw a concurrent error', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: TIMESTAMP_1,
      payload: { index: 1 },
    });

    try {
      await eventstoreAdapter.saveEvent({
        type: 'AAA',
        aggregateId: 'id1',
        aggregateVersion: 1,
        timestamp: TIMESTAMP_1,
        payload: { index: 1 },
      });
      return Promise.reject(new Error('Test failed'));
    } catch (error) {
      expect(error).toBeInstanceOf(ConcurrentError);
    }
  });

  test('"saveEvent" should throw an error when a bad event', async () => {
    try {
      await eventstoreAdapter.saveEvent({
        /* BAD_EVENT */
      });
      return Promise.reject(new Error('Test failed'));
    } catch (error) {
      expect(error.code).toEqual('SQLITE_ERROR');
    }
  });

  test('"loadEvents" should load events', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: TIMESTAMP_1,
      payload: { index: 1 },
    });
    await eventstoreAdapter.saveEvent({
      type: 'CCC',
      aggregateId: 'id3',
      aggregateVersion: 1,
      timestamp: TIMESTAMP_2,
      payload: { index: 2 },
    });
    await eventstoreAdapter.saveEvent({
      type: 'BBB',
      aggregateId: 'id2',
      aggregateVersion: 1,
      timestamp: TIMESTAMP_3,
      payload: { index: 3 },
    });
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id2',
      aggregateVersion: 2,
      timestamp: TIMESTAMP_4,
      payload: { index: 4 },
    });
    await eventstoreAdapter.saveEvent({
      type: 'BBB',
      aggregateId: 'id1',
      aggregateVersion: 2,
      timestamp: TIMESTAMP_5,
      payload: { index: 5 },
    });
    await eventstoreAdapter.saveEvent({
      type: 'CCC',
      aggregateId: 'id3',
      aggregateVersion: 2,
      timestamp: TIMESTAMP_6,
      payload: { index: 6 },
    });

    let events = [];
    await eventstoreAdapter.loadEvents({}, (event) => {
      events.push(event);
    });

    expect(events).toMatchObject([
      {
        type: 'AAA',
        aggregateId: 'id1',
        aggregateVersion: 1,
        timestamp: TIMESTAMP_1,
        payload: { index: 1 },
      },
      {
        type: 'CCC',
        aggregateId: 'id3',
        aggregateVersion: 1,
        timestamp: TIMESTAMP_2,
        payload: { index: 2 },
      },
      {
        type: 'BBB',
        aggregateId: 'id2',
        aggregateVersion: 1,
        timestamp: TIMESTAMP_3,
        payload: { index: 3 },
      },
      {
        type: 'AAA',
        aggregateId: 'id2',
        aggregateVersion: 2,
        timestamp: TIMESTAMP_4,
        payload: { index: 4 },
      },
      {
        type: 'BBB',
        aggregateId: 'id1',
        aggregateVersion: 2,
        timestamp: TIMESTAMP_5,
        payload: { index: 5 },
      },
      {
        type: 'CCC',
        aggregateId: 'id3',
        aggregateVersion: 2,
        timestamp: TIMESTAMP_6,
        payload: { index: 6 },
      },
    ]);

    events = [];
    await eventstoreAdapter.loadEvents({ eventTypes: ['AAA'] }, (event) => {
      events.push(event);
    });

    expect(events).toMatchObject([
      {
        type: 'AAA',
        aggregateId: 'id1',
        aggregateVersion: 1,
        payload: { index: 1 },
      },
      {
        type: 'AAA',
        aggregateId: 'id2',
        aggregateVersion: 2,
        timestamp: TIMESTAMP_4,
        payload: { index: 4 },
      },
    ]);

    events = [];
    await eventstoreAdapter.loadEvents({ aggregateIds: ['id1'] }, (event) => {
      events.push(event);
    });

    expect(events).toMatchObject([
      {
        type: 'AAA',
        aggregateId: 'id1',
        aggregateVersion: 1,
        timestamp: TIMESTAMP_1,
        payload: { index: 1 },
      },
      {
        type: 'BBB',
        aggregateId: 'id1',
        aggregateVersion: 2,
        timestamp: TIMESTAMP_5,
        payload: { index: 5 },
      },
    ]);

    events = [];
    await eventstoreAdapter.loadEvents(
      {
        startTime: TIMESTAMP_2 - 1,
        finishTime: TIMESTAMP_5 + 1,
      },
      (event) => {
        events.push(event);
      }
    );

    expect(events).toMatchObject([
      {
        type: 'CCC',
        aggregateId: 'id3',
        aggregateVersion: 1,
        timestamp: TIMESTAMP_2,
        payload: { index: 2 },
      },
      {
        type: 'BBB',
        aggregateId: 'id2',
        aggregateVersion: 1,
        timestamp: TIMESTAMP_3,
        payload: { index: 3 },
      },
      {
        type: 'AAA',
        aggregateId: 'id2',
        aggregateVersion: 2,
        timestamp: TIMESTAMP_4,
        payload: { index: 4 },
      },
      {
        type: 'BBB',
        aggregateId: 'id1',
        aggregateVersion: 2,
        timestamp: TIMESTAMP_5,
        payload: { index: 5 },
      },
    ]);
  });

  test('"drop" should drop events', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: TIMESTAMP_1,
      payload: { index: 1 },
    });

    let events = [];
    await eventstoreAdapter.loadEvents({}, (event) => {
      events.push(event);
    });

    expect(events.length).toEqual(1);

    await eventstoreAdapter.drop();

    try {
      await eventstoreAdapter.loadEvents({}, () => {});
      return Promise.reject(new Error('Test failed'));
    } catch (error) {
      expect(error.message).toContain('no such table');
    }
  });

  test('"getLatestEvent" should get the latest event', async () => {
    await eventstoreAdapter.saveEvent({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: TIMESTAMP_1,
      payload: { index: 1 },
    });

    expect(await eventstoreAdapter.getLatestEvent({})).toMatchObject({
      type: 'AAA',
      aggregateId: 'id1',
      aggregateVersion: 1,
      payload: { index: 1 },
    });

    await eventstoreAdapter.saveEvent({
      type: 'BBB',
      aggregateId: 'id1',
      aggregateVersion: 2,
      timestamp: TIMESTAMP_2,
      payload: { index: 2 },
    });

    expect(await eventstoreAdapter.getLatestEvent({})).toMatchObject({
      type: 'BBB',
      aggregateId: 'id1',
      aggregateVersion: 2,
      payload: { index: 2 },
    });
  });
});
