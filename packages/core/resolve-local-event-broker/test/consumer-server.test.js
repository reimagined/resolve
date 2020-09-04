import createAndInitConsumer from '../src/consumer-server';
import { createServer } from 'resolve-local-rpc';

jest.mock('resolve-local-rpc', () => ({
  createServer: jest.fn(),
}));

test('should create and init consumer', async () => {
  const initResolve = jest.fn().mockImplementation(async () => {});
  const disposeResolve = jest.fn().mockImplementation(async () => {});
  const baseResolve = {
    eventListener: {
      SendEvents: jest.fn().mockImplementation(async () => 'SendEvents'),
    },
    eventStore: {
      LoadEvents: jest.fn().mockImplementation(async () => 'LoadEvents'),
    },
  };

  await createAndInitConsumer({
    address: 'address',
    baseResolve,
    initResolve,
    disposeResolve,
  });

  expect(createServer.mock.calls.length).toEqual(1);
  const hostObject = createServer.mock.calls[0][0].hostObject;

  expect(await hostObject.SendEvents()).toEqual('SendEvents');
  expect(initResolve.mock.calls.length).toEqual(1);
  expect(Object.getPrototypeOf(initResolve.mock.calls[0][0])).toEqual(
    baseResolve
  );
  expect(disposeResolve.mock.calls.length).toEqual(1);
  expect(Object.getPrototypeOf(disposeResolve.mock.calls[0][0])).toEqual(
    baseResolve
  );

  expect(await hostObject.LoadEvents()).toEqual('LoadEvents');
  expect(initResolve.mock.calls.length).toEqual(2);
  expect(Object.getPrototypeOf(initResolve.mock.calls[1][0])).toEqual(
    baseResolve
  );
  expect(disposeResolve.mock.calls.length).toEqual(2);
  expect(Object.getPrototypeOf(disposeResolve.mock.calls[1][0])).toEqual(
    baseResolve
  );

  try {
    await hostObject.DummyMethod();
    return Promise.reject('Test failed');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('DummyMethod');
  }

  expect(initResolve.mock.calls.length).toEqual(3);
  expect(Object.getPrototypeOf(initResolve.mock.calls[2][0])).toEqual(
    baseResolve
  );
  expect(disposeResolve.mock.calls.length).toEqual(3);
  expect(Object.getPrototypeOf(disposeResolve.mock.calls[2][0])).toEqual(
    baseResolve
  );
});
