import 'source-map-support/register'
import partial from 'lodash.partial'

import type { RuntimeOptions } from './types'
import { coldStartHandler } from './cold-start-handler'

const factory = (options: RuntimeOptions) => ({
  entry: partial(coldStartHandler, options),
  execMode: 'external',
})

export default factory
