import fetch from 'node-fetch';
import express from 'express';
import { getClient, Client } from '../../src/index';

let app: any;
let server: any;

beforeAll(() => {
  app = express();

  app.get('/api/query/read-model/resolver', (req: any, res: any) => {
    res.setHeader('Date', '12345');
    res.send(
      JSON.stringify({
        data: {
          status: 'valid',
        },
      })
    );
  });

  server = app.listen('3300');
});

afterAll(() => {
  server.close();
});

let client: Client;

beforeEach(() => {
  client = getClient({
    origin: 'http://localhost:3300',
    rootPath: '',
    staticPath: '/static',
    viewModels: [],
    fetch,
  });
});

test('bug: waitFor headers are undefined on success validation', async () => {
  const result = await client.query(
    {
      name: 'read-model',
      resolver: 'resolver',
      args: {},
    },
    {
      waitFor: {
        validator: (result: any): boolean => result.data.status === 'valid',
        attempts: 1,
        period: 1,
      },
    }
  );
  expect(result).toEqual({
    meta: {
      timestamp: 12345,
    },
    data: {
      status: 'valid',
    },
  });
});
