import { QueryCallback, ReadModelQuery } from 'resolve-client';
import { mocked } from 'ts-jest/utils';
import { useDispatch } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import { useQuery } from 'resolve-react-hooks';
import {
  queryReadModelFailure,
  queryReadModelRequest,
  queryReadModelSuccess,
} from '../../src/read-model/actions';
import { getEntry } from '../../src/read-model/read-model-reducer';
import { ResultStatus } from '../../src';
import {
  useReduxReadModel,
  ReduxReadModelHookOptions,
} from '../../src/read-model/use-redux-read-model';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));
jest.mock('resolve-react-hooks', () => ({
  useQuery: jest.fn(),
}));
jest.mock('../../src/read-model/read-model-reducer', () => ({
  getEntry: jest.fn(() => 'state-entry'),
}));

const mUseDispatch = mocked(useDispatch);
const mUseQuery = mocked(useQuery);
const mGetEntry = mocked(getEntry);
const mDispatch = jest.fn();
const mUseQueryHookExecutor = jest.fn();

const extractUseQueryCallback = (): QueryCallback => mUseQuery.mock.calls[0][2];

beforeAll(() => {
  mUseDispatch.mockReturnValue(mDispatch);
  mUseQuery.mockReturnValue(mUseQueryHookExecutor);
});

afterEach(() => {
  mDispatch.mockClear();
  mUseQuery.mockClear();
  mUseQueryHookExecutor.mockClear();
});

const makeQuery = (): ReadModelQuery => ({
  name: 'read-model',
  resolver: 'resolver',
  args: {
    a: 'a',
  },
});

const renderReadModelHook = (
  query: ReadModelQuery,
  initialState: any,
  options?: ReduxReadModelHookOptions
) => {
  const {
    result: { current },
  } = renderHook(() =>
    options
      ? useReduxReadModel(query, initialState, options)
      : useReduxReadModel(query, initialState)
  );
  return current;
};

test('internal actions are dispatched', () => {
  const query = makeQuery();
  const { request } = renderReadModelHook(query, { initial: 'state' });

  act(() => request());

  expect(mDispatch).toHaveBeenCalledWith(
    queryReadModelRequest(query, { initial: 'state' })
  );

  const callback = extractUseQueryCallback();

  mDispatch.mockClear();
  callback(null, { data: { result: 'ok' } }, query);
  expect(mDispatch).toHaveBeenCalledWith(
    queryReadModelSuccess(query, { data: { result: 'ok' } })
  );

  mDispatch.mockClear();
  callback(Error('error'), null, query);
  expect(mDispatch).toHaveBeenCalledWith(
    queryReadModelFailure(query, Error('error'))
  );
});

test('useQuery base hook called with query and default options', () => {
  const query = makeQuery();
  const { request } = renderReadModelHook(query, null);

  act(() => request());

  expect(mUseQuery).toHaveBeenCalledTimes(1);
  expect(mUseQuery).toHaveBeenCalledWith(
    query,
    {
      method: 'GET',
    },
    expect.any(Function),
    expect.any(Array)
  );
});

test('custom command options are passed to base hook', () => {
  const validator = jest.fn();

  renderReadModelHook(makeQuery(), null, {
    queryOptions: {
      method: 'POST',
      waitFor: {
        attempts: 123,
        validator,
      },
    },
  });

  expect(mUseQuery).toHaveBeenCalledWith(
    expect.anything(),
    {
      method: 'POST',
      waitFor: {
        attempts: 123,
        validator,
      },
    },
    expect.anything(),
    expect.anything()
  );
});

test('custom redux actions', () => {
  const query = makeQuery();
  const { request } = renderReadModelHook(
    query,
    { initial: 'state' },
    {
      actions: {
        request: (query, initialState) => ({
          type: 'request',
          query,
          initialState,
        }),
        success: (query, result) => ({ type: 'success', query, result }),
        failure: (query, error) => ({ type: 'failure', query, error }),
      },
    }
  );

  act(() => request());

  expect(mDispatch).toHaveBeenCalledWith({
    type: 'request',
    query,
    initialState: { initial: 'state' },
  });

  const callback = extractUseQueryCallback();

  mDispatch.mockClear();
  callback(null, { data: { a: 'a' } }, query);
  expect(mDispatch).toHaveBeenCalledWith({
    type: 'success',
    query,
    result: { data: { a: 'a' } },
  });

  mDispatch.mockClear();
  callback(Error('error'), null, query);
  expect(mDispatch).toHaveBeenCalledWith({
    type: 'failure',
    query,
    error: Error('error'),
  });
});

test('redux state selector: no selectorId', () => {
  const query = makeQuery();
  const { selector } = renderReadModelHook(query, { initial: 'state' });

  const state = {
    readModels: {
      name: {
        resolver: { args: { status: ResultStatus.Ready, data: 'data' } },
      },
    },
  };

  expect(selector(state)).toEqual('state-entry');
  expect(mGetEntry).toHaveBeenCalledWith(
    state.readModels,
    { query },
    {
      status: ResultStatus.Initial,
      data: { initial: 'state' },
    }
  );
});

test('redux state selector: selectorId used', () => {
  const query = makeQuery();
  const { selector } = renderReadModelHook(
    query,
    { initial: 'state' },
    { selectorId: 'selector-id' }
  );

  const state = {
    readModels: {
      name: {
        resolver: { args: { status: ResultStatus.Ready, data: 'data' } },
      },
    },
  };

  expect(selector(state)).toEqual('state-entry');
  expect(mGetEntry).toHaveBeenCalledWith(state.readModels, 'selector-id', {
    status: ResultStatus.Initial,
    data: { initial: 'state' },
  });
});
