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

const splitByKind = splitBy(byKind)

const formatExampleInfo = ({ name, description }) =>
  `* ${name.replace(/(?:-ts|-js)$/, '')} - ${description}`

const formatExamplesList = (availableExamples, indentationLevel = 0) => {
  const lines = []
  const examplesWithGrouping = appendGroupingInformation(availableExamples)
  const { examples, templates } = splitByKind(examplesWithGrouping)
  if (templates && templates.length > 0) {
    lines.push(
      ...formatItemsGroup(
        Array.from(new Set(templates.map(formatExampleInfo))),
        'Templates:',
        indentationLevel
      )
    )
  }
  if (examples && examples.length > 0) {
    lines.push(
      ...formatItemsGroup(
        Array.from(new Set(examples.map(formatExampleInfo))),
        'Examples:',
        indentationLevel
      )
    )
  }
  return lines
}

export { formatExamplesList }
