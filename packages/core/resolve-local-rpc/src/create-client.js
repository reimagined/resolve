import http from 'http';
import https from 'https';
import { URL } from 'url';

export const DEFAULT_HOOK = Symbol('DEFAULT_HOOK');

const defaultPreExecHook = async (args) => args;
const defaultPostExecHook = async (args, result) => result;

function request(address, preExecHooks, postExecHooks, method, ...args) {
  return new Promise(async (resolve, reject) => {
    try {
      const preExecHook =
        typeof preExecHooks[method] === 'function'
          ? preExecHooks[method]
          : typeof preExecHooks[DEFAULT_HOOK] === 'function'
          ? preExecHooks[DEFAULT_HOOK]
          : defaultPreExecHook;

      const postExecHook =
        typeof postExecHooks[method] === 'function'
          ? postExecHooks[method]
          : typeof postExecHooks[DEFAULT_HOOK] === 'function'
          ? postExecHooks[DEFAULT_HOOK]
          : defaultPostExecHook;

      const inputData = { method, args: await preExecHook(args) };
      const inputDataEncoded = JSON.stringify(inputData);
      const parsedUrl = new URL(address);

      const [clientFactory, defaultPort] =
        parsedUrl.protocol === 'https:'
          ? [https, 443]
          : parsedUrl.protocol === 'http:'
          ? [http, 80]
          : null;

      if (clientFactory == null) {
        throw new Error(`Invalid protocol ${parsedUrl.protocol}`);
      }

      const port = parsedUrl.port != null ? parsedUrl.port : defaultPort;

      const req = clientFactory.request(
        {
          host: parsedUrl.hostname,
          port: port,
          path: '/',
          method: 'POST',
          headers: {
            'Content-Length': Buffer.byteLength(inputDataEncoded),
            'Content-Type': 'application/json',
          },
        },
        (res) => {
          const buffers = [];
          res.on('error', reject);
          res.on('data', (buffer) => buffers.push(buffer));
          res.on('end', async () => {
            let result = null;
            try {
              result = Buffer.concat(buffers).toString();
              if (res.statusCode !== 200) {
                const responseError = JSON.parse(result);
                const error = new Error(responseError.message);
                error.code = responseError.code;
                error.name = responseError.name;
                error.stack = responseError.stack;

                throw error;
              }
              try {
                const data = await postExecHook(
                  inputData.args,
                  JSON.parse(result)
                );

                resolve(data);
              } catch (err) {
                // eslint-disable-next-line no-console
                console.warn(
                  `Post-exec hook for ${method} failed with error: ${err}`
                );
                reject(err);
              }
            } catch (error) {
              try {
                const data = await postExecHook(inputData.args, error);

                reject(data);
              } catch (err) {
                // eslint-disable-next-line no-console
                console.warn(
                  `Post-exec hook for ${method} failed with error: ${err}`
                );
                reject(err);
              }
            }
          });
        }
      );

      req.write(inputDataEncoded);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

const createClient = async ({ address, preExecHooks, postExecHooks }) => {
  if (
    !(
      (preExecHooks == null || Object(preExecHooks) === preExecHooks) &&
      (postExecHooks == null || Object(postExecHooks) === postExecHooks)
    )
  ) {
    throw new Error(
      `Either preExecHooks nor postExecHooks should differ from null or object`
    );
  }

  const client = new Proxy(
    {},
    {
      get(_, method) {
        if (method === 'then') {
          return client;
        } else {
          return request.bind(
            null,
            address,
            preExecHooks != null ? preExecHooks : {},
            postExecHooks != null ? postExecHooks : {},
            method
          );
        }
      },
    }
  );

  return client;
};

export default createClient;
