import { HOT_MODULE_REPLACEMENT } from '../internal/action-types'

export const hotModuleReplacement = (hotModuleReplacementId: any) => ({
  type: HOT_MODULE_REPLACEMENT,
  hotModuleReplacementId,
})
