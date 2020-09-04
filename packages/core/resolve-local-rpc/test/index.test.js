import { mainHandler } from '../src/create-server';

test('serializing error', async () => {
  const hostObject = {
    async saveEvent() {
      const error = new Error('Concurrent error');
      error.code = 409;
      throw error;
    },
  };

  const request = {
    method: 'POST',
    on(event, callback) {
      if (event === 'data') {
        callback(
          Buffer.from(JSON.stringify({ method: 'saveEvent', args: [] }))
        );
      } else if (event === 'end') {
        callback();
      }
      return request;
    },
  };
  const response = { end: jest.fn() };

  await mainHandler(hostObject, request, response);

  expect(JSON.parse(response.end.mock.calls[0])).toMatchObject({
    name: 'Error',
    code: 409,
    message: 'Concurrent error',
  });
});
