import { Command } from 'resolve-core'
import { CommandCallback, CommandOptions } from 'resolve-client'
import { CommandBuilder, CommandExecutor, useCommand } from './use-command'

function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>
): CommandExecutor<T>
function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>,
  options: CommandOptions
): CommandExecutor<T>
function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>,
  callback: CommandCallback
): CommandExecutor<T>
function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>,
  dependencies: any[]
): CommandExecutor<T>
function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<T>
function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>,
  options: CommandOptions,
  callback: CommandCallback
): CommandExecutor<T>
function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<T>
function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>,
  options: CommandOptions,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<T>
function useCommandBuilder<T, R extends Command>(
  builder: CommandBuilder<T, R>,
  options?: CommandOptions | CommandCallback | any[],
  callback?: CommandCallback | any[],
  dependencies?: any[]
): CommandExecutor<T> {
  return useCommand(
    builder,
    options as any,
    callback as any,
    dependencies as any
  )
}

export { useCommandBuilder }
