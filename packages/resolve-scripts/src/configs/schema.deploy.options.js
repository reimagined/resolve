export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  properties: {
    config: {
      type: 'string'
    },
    mode: {
      type: 'string',
      enum: ['development', 'production']
    },
    build: {
      type: 'boolean'
    },
    start: {
      type: 'boolean'
    },
    watch: {
      type: 'boolean'
    },
    host: {
      type: 'string'
    },
    port: {
      type: 'integer'
    },
    protocol: {
      type: 'string',
      enum: ['http', 'https']
    },
    inspectHost: {
      type: 'string'
    },
    inspectPort: {
      type: 'integer'
    },
    useYarn: {
      type: 'boolean'
    },
    applicationName: {
      type: 'boolean'
    },
    openBrowser: {
      type: 'boolean'
    },
    browser: {
      type: 'boolean'
    }
  },
  additionalProperties: false
}
