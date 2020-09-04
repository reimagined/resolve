import { mocked } from 'ts-jest/utils';
import { QueryCallback, QueryOptions } from 'resolve-client';
import { useQuery } from '../src/use-query';
import { useQueryBuilder } from '../src/use-query-builder';

jest.mock('resolve-client');
jest.mock('react', () => ({
  useCallback: jest.fn((cb) => cb),
}));
jest.mock('../src/use-query', () => ({
  useQuery: jest.fn(),
}));

const mockedUseQuery = mocked(useQuery);

const clearMocks = (): void => {
  mockedUseQuery.mockClear();
};

afterEach(() => {
  clearMocks();
});

describe('common', () => {
  test('useQuery hook called', () => {
    const queryBuilder = jest.fn();
    const queryOptions: QueryOptions = {};
    const queryCallback: QueryCallback = jest.fn();
    const dependencies: any[] = [];

    useQueryBuilder(queryBuilder, queryOptions, queryCallback, dependencies);

    expect(mockedUseQuery).toHaveBeenCalledWith(
      queryBuilder,
      queryOptions,
      queryCallback,
      dependencies
    );
  });
});
