import { OPTIONAL_ASSET_PREFIX } from './constants'

const detectErrors = (stats, forward) =>
  forward
    ? stats
        .filter(
          (val) => !val.compilation.name.startsWith(OPTIONAL_ASSET_PREFIX)
        )
        .reduce((acc, val) => acc || (val != null && val.hasErrors()), false)
    : stats
        .filter(
          (val) => !val.compilation.name.startsWith(OPTIONAL_ASSET_PREFIX)
        )
        .reduce((acc, val) => acc && val != null && !val.hasErrors(), true)

export default detectErrors
