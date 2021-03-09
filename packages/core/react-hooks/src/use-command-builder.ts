import { CommandCallback, CommandOptions, Command } from '@resolve-js/client'
import { CommandBuilder, CommandExecutor, useCommand } from './use-command'

function useCommandBuilder<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>
): CommandExecutor<TArgs>
function useCommandBuilder<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  callback: CommandCallback<TCmd>
): CommandExecutor<TArgs>
function useCommandBuilder<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandOptions
): CommandExecutor<TArgs>
function useCommandBuilder<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  dependencies: any[]
): CommandExecutor<TArgs>
function useCommandBuilder<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  callback: CommandCallback<TCmd>,
  dependencies: any[]
): CommandExecutor<TArgs>
function useCommandBuilder<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandOptions,
  callback: CommandCallback<TCmd>
): CommandExecutor<TArgs>
function useCommandBuilder<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<TArgs>
function useCommandBuilder<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandOptions,
  callback: CommandCallback<TCmd>,
  dependencies: any[]
): CommandExecutor<TArgs>
function useCommandBuilder<TArgs extends any[], R extends Command>(
  builder: CommandBuilder<TArgs, R>,
  options?: CommandOptions | CommandCallback<R> | any[],
  callback?: CommandCallback<R> | any[],
  dependencies?: any[]
): CommandExecutor<TArgs> {
  return useCommand(
    builder,
    options as any,
    callback as any,
    dependencies as any
  )
}

export { useCommandBuilder }
