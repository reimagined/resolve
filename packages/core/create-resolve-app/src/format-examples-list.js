const appendGroupingInformation = (examples = []) =>
  examples.map((example) => ({
    ...example,
    language:
      example.name.includes('angular') ||
      example.name.includes('typescript') ||
      example.name.endsWith('-ts')
        ? 'ts'
        : 'js',
    isTemplate: example.path.startsWith('/templates'),
  }))

const formatItemsGroup = (items, title = '', indentationLevel = 0) => {
  const indentationSymbol = ' '
  const indentationStep = 2
  const titleIndent = indentationLevel * indentationStep
  const itemsIndent = title ? titleIndent + indentationStep : titleIndent
  const result = []
  if (items && items.length > 0) {
    if (title) {
      result.push(`${indentationSymbol.repeat(titleIndent)}${title}`)
    }
    result.push(
      ...items.map((item) => `${indentationSymbol.repeat(itemsIndent)}${item}`)
    )
  }
  return result
}

const splitBy = (keyBy) => (items = []) =>
  items.reduce((result, item) => {
    const key = keyBy(item)
    result[key] = [...(result[key] ?? []), item]
    return result
  }, {})

const byKind = (item) => (item.isTemplate ? 'templates' : 'examples')
const byLanguage = (item) => item.language ?? 'js'

const splitByKind = splitBy(byKind)
const splitByLanguage = splitBy(byLanguage)

const formatExampleInfo = ({ name, description }) =>
  `* ${name} - ${description}`

const formatExamplesList = (availableExamples, indentationLevel = 0) => {
  const lines = []
  const examplesWithGrouping = appendGroupingInformation(availableExamples)
  const { examples, templates } = splitByKind(examplesWithGrouping)
  if (templates && templates.length > 0) {
    const { ts, js } = splitByLanguage(templates)
    lines.push(
      ...formatItemsGroup(
        [
          ...formatItemsGroup(ts?.map(formatExampleInfo), 'Typescript', 0),
          ...formatItemsGroup(js?.map(formatExampleInfo), 'JavaScript', 0),
        ],
        'Templates:',
        indentationLevel
      )
    )
  }
  if (examples && examples.length > 0) {
    const { ts, js } = splitByLanguage(examples)
    lines.push(
      ...formatItemsGroup(
        [
          ...formatItemsGroup(ts?.map(formatExampleInfo), 'Typescript', 0),
          ...formatItemsGroup(js?.map(formatExampleInfo), 'JavaScript', 0),
        ],
        'Examples:',
        indentationLevel
      )
    )
  }
  return lines
}

export { formatExamplesList }
