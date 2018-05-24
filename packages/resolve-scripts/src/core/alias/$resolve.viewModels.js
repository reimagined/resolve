import path from 'path'
import resolveFile from '../resolve_file'

module.exports = ({ resolveConfig, isClient }) => {
  return {
    code:
`
const viewModels = []

${resolveConfig.viewModels.map(
  (viewModel, index) => {
    const name = viewModel.name;

    const projection = resolveFile(viewModel.projection)

    let serializeState = path.resolve(__dirname, '../../runtime/common/view-models/serialize_state.js');
    try {
      serializeState = resolveFile(viewModel.serializeState)
    } catch {}

    let deserializeState = path.resolve(__dirname, '../../runtime/common/view-models/deserialize_state.js');
    try {
      deserializeState = resolveFile(viewModel.deserializeState)
    } catch {}
    
    let validator = path.resolve(__dirname, '../../runtime/common/view-models/validator.js');
    try {
      validator = resolveFile(viewModel.validator)
    } catch {}
    
    return `
const name_${index} = "${name}"
import projection_${index} from "${projection}"
import serializeState_${index} from "${serializeState}"
import deserializeState_${index} from "${deserializeState}"
import validator_${index} from "${deserializeState}"

 "validator": {
          "type": "string",
          "constraints": {
            "file": true
          }
        },
        "snapshot": {
          "$ref": "#/definitions/adapter"
        }

viewModels.push({ 
  name: name_${index},
  projection: projection_${index}, 
  serializeState: serializeState_${index}, 
  deserializeState: deserializeState_${index}, 
})
    `
  }
)}

export default viewModels
`
  }
}