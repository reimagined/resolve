import type { RuntimeEntryContext } from '@resolve-js/runtime-base'
import partial from 'lodash.partial'

import type { RuntimeOptions } from './types'
import { lambdaHandler } from './lambda-handler'

export const coldStartHandler = async (
  runtimeOptions: RuntimeOptions,
  runtimeEntryContext: RuntimeEntryContext
) => partial(lambdaHandler, runtimeOptions, runtimeEntryContext)
