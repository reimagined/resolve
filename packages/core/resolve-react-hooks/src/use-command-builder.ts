import { CommandCallback, CommandOptions } from 'resolve-client';
import { CommandBuilder, CommandExecutor, useCommand } from './use-command';

function useCommandBuilder<T>(builder: CommandBuilder<T>): CommandExecutor<T>;
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions
): CommandExecutor<T>;
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  callback: CommandCallback
): CommandExecutor<T>;
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  dependencies: any[]
): CommandExecutor<T>;
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<T>;
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  callback: CommandCallback
): CommandExecutor<T>;
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<T>;
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<T>;
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options?: CommandOptions | CommandCallback | any[],
  callback?: CommandCallback | any[],
  dependencies?: any[]
): CommandExecutor<T> {
  return useCommand(
    builder,
    options as any,
    callback as any,
    dependencies as any
  );
}

export { useCommandBuilder };
