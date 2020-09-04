import { mocked } from 'ts-jest/utils';
import { useCommand } from '../src/use-command';
import { useCommandBuilder } from '../src/use-command-builder';
import { CommandCallback, CommandOptions } from 'resolve-client';

jest.mock('resolve-client');
jest.mock('react', () => ({
  useCallback: jest.fn((cb) => cb),
}));
jest.mock('../src/use-command', () => ({
  useCommand: jest.fn(),
}));

const mockedUseCommand = mocked(useCommand);

const mockedClient = {
  command: jest.fn(() => Promise.resolve({ result: 'command-result' })),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

const clearMocks = (): void => {
  mockedUseCommand.mockClear();
  mockedClient.command.mockClear();
};

afterEach(() => {
  clearMocks();
});

describe('common', () => {
  test('useCommand hook called', () => {
    const commandBuilder = jest.fn();
    const commandOptions: CommandOptions = {};
    const commandCallback: CommandCallback = jest.fn();
    const dependencies: any[] = [];

    useCommandBuilder(
      commandBuilder,
      commandOptions,
      commandCallback,
      dependencies
    );

    expect(mockedUseCommand).toHaveBeenCalledWith(
      commandBuilder,
      commandOptions,
      commandCallback,
      dependencies
    );
  });
});
