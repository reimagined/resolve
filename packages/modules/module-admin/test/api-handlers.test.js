import readModelList from '../src/api-handlers/event-broker-read-models-list'
import sagasList from '../src/api-handlers/event-broker-sagas-list'

describe('@resolve-js/module-admin', () => {
  test('handler "readModelList" should tolerate to errors', async () => {
    let result = null

    const req = {
      resolve: {
        readModels: [{ name: 'goodReadModel' }, { name: 'badReadModel' }],
        eventSubscriber: {
          status: ({ eventSubscriber }) => {
            if (eventSubscriber === 'badReadModel') {
              throw new Error('test')
            }
            return {
              eventSubscriber,
              status: 'deliver',
            }
          },
        },
      },
    }

    const res = {
      json(obj) {
        result = obj
      },
    }

    await readModelList(req, res)

    expect(result).toEqual([
      { eventSubscriber: 'goodReadModel', status: 'deliver' },
      {
        errors: [
          {
            message: 'test',
            name: 'Error',
            stack: expect.any(String),
          },
        ],
        eventSubscriber: 'badReadModel',
        status: 'error',
      },
    ])
  })

  test('handler "sagasList" should tolerate to errors', async () => {
    let result = null

    const req = {
      resolve: {
        sagas: [{ name: 'goodReadModel' }, { name: 'badReadModel' }],
        eventSubscriber: {
          status: ({ eventSubscriber }) => {
            if (eventSubscriber === 'badReadModel') {
              throw new Error('test')
            }
            return {
              eventSubscriber,
              status: 'deliver',
            }
          },
        },
        domainInterop: {
          sagaDomain: {
            getSchedulersNamesBySagas: jest.fn(),
            getSagasSchedulersInfo: jest.fn().mockReturnValue([
              {
                name: '__SCHEDULER__',
              },
            ]),
          },
        },
      },
    }

    const res = {
      json(obj) {
        result = obj
      },
    }

    await sagasList(req, res)

    expect(result).toEqual([
      { eventSubscriber: 'goodReadModel', status: 'deliver' },
      {
        errors: [
          {
            message: 'test',
            name: 'Error',
            stack: expect.any(String),
          },
        ],
        eventSubscriber: 'badReadModel',
        status: 'error',
      },
      { eventSubscriber: '__SCHEDULER__', status: 'deliver' },
    ])

    expect(
      req.resolve.domainInterop.sagaDomain.getSchedulersNamesBySagas
    ).not.toHaveBeenCalled()
    expect(
      req.resolve.domainInterop.sagaDomain.getSagasSchedulersInfo
    ).toHaveBeenCalled()
  })
})
