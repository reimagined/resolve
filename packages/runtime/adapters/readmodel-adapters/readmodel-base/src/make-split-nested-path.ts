import { MakeSplitNestedPathMethod, SplitNestedPathMethod } from './types'

const makeSplitNestedPath: MakeSplitNestedPathMethod = (PathToolkit) => {
  const pathToolkit = new PathToolkit()
  pathToolkit.setOptions({
    cache: false,
    force: false,
    simple: false,
    defaultReturnVal: undefined,
    separators: {
      '.': {
        exec: 'property',
      },
    },
    prefixes: {},
    containers: {
      "'": {
        closer: "'",
        exec: `${'single'}${'quote'}`,
      },
      '"': {
        closer: '"',
        exec: `${'double'}${'quote'}`,
      },
    },
  })

  const splitNestedPath: SplitNestedPathMethod = (input) => {
    if (input == null || input.constructor !== String) {
      throw new Error(`Invalid json path ${input}: must be string`)
    }
    const output = pathToolkit.getTokens(input)
    if (output == null) {
      throw new Error(`Invalid json path ${input}: parse failed`)
    }

    return output.t
  }

  return splitNestedPath
}

export default makeSplitNestedPath
