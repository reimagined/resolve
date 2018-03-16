import path from 'path'

import exec from './exec'

describe('resolve-scripts build', () => {
  describe('argv.mode', () => {
    test('resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build')

      expect(json).toHaveProperty('build', true)
      expect(json).toHaveProperty('mode', 'development')
    })

    test('resolve-scripts build --dev', async () => {
      const json = await exec('resolve-scripts build --dev')

      expect(json).toHaveProperty('build', true)
      expect(json).toHaveProperty('mode', 'development')
    })

    test('resolve-scripts build --prod', async () => {
      const json = await exec('resolve-scripts build --prod')

      expect(json).toHaveProperty('build', true)
      expect(json).toHaveProperty('mode', 'production')
    })

    test('resolve-scripts build --dev --prod (fail)', async () => {
      expect(exec('resolve-scripts build --dev --prod')).rejects.toThrow()
    })

    test('NODE_ENV=production resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build', {
        NODE_ENV: 'production'
      })

      expect(json).toHaveProperty('build', true)
      expect(json).toHaveProperty('mode', 'production')
    })

    test('NODE_ENV=development resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build', {
        NODE_ENV: 'development'
      })

      expect(json).toHaveProperty('build', true)
      expect(json).toHaveProperty('mode', 'development')
    })

    test('NODE_ENV=test resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build', {
        NODE_ENV: 'development'
      })

      expect(json).toHaveProperty('build', true)
      expect(json).toHaveProperty('mode', 'development')
    })

    test('NODE_ENV=INCORRECT_VALUE resolve-scripts build (fail)', async () => {
      expect(
        exec('resolve-scripts build', { NODE_ENV: 'INCORRECT_VALUE' })
      ).rejects.toThrow()
    })
  })

  describe('argv.watch', () => {
    test('resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build')

      expect(json).toHaveProperty('watch', false)
    })

    test('resolve-scripts build --watch', async () => {
      const json = await exec('resolve-scripts build --watch')

      expect(json).toHaveProperty('watch', true)
    })

    test('WATCH=false resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build', { WATCH: false })

      expect(json).toHaveProperty('watch', false)
    })

    test('WATCH=true resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build', { WATCH: true })

      expect(json).toHaveProperty('watch', true)
    })
  })

  describe('argv.start', () => {
    test('resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build')

      expect(json).toHaveProperty('start', false)
    })

    test('resolve-scripts build --start', async () => {
      const json = await exec('resolve-scripts build --start')

      expect(json).toHaveProperty('start', true)
    })

    test('START=false resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build', { START: false })

      expect(json).toHaveProperty('start', false)
    })

    test('START=true resolve-scripts build', async () => {
      const json = await exec('resolve-scripts build', { START: true })

      expect(json).toHaveProperty('start', true)
    })
  })

  describe('argv.host', () => {
    test('resolve-scripts build --start --host=http://test.test', async () => {
      const json = await exec(
        'resolve-scripts build --start --host=http://test.test'
      )

      expect(json).toHaveProperty('start', true)
      expect(json).toHaveProperty('host', 'http://test.test')
    })

    test('resolve-scripts build --host=http://test.test (fail)', async () => {
      expect(
        exec('resolve-scripts build --host=http://test.test')
      ).rejects.toThrow()
    })
  })

  describe('argv.port', () => {
    test('resolve-scripts build --start --port=1234', async () => {
      const json = await exec('resolve-scripts build --start --port=1234')

      expect(json).toHaveProperty('start', true)
      expect(json).toHaveProperty('port', 1234)
    })

    test('resolve-scripts build --port=1234 (fail)', async () => {
      expect(exec('resolve-scripts build --port=1234')).rejects.toThrow()
    })
  })

  describe('argv.inspect', () => {
    test('resolve-scripts build --start --inspect', async () => {
      const json = await exec('resolve-scripts build --start --inspect')

      expect(json).toHaveProperty('inspectHost', '127.0.0.1')
      expect(json).toHaveProperty('inspectPort', 9229)
    })

    test('resolve-scripts build --start --inspect=1234', async () => {
      const json = await exec('resolve-scripts build --start --inspect=1234')

      expect(json).toHaveProperty('inspectHost', '127.0.0.1')
      expect(json).toHaveProperty('inspectPort', 1234)
    })

    test('resolve-scripts build --start --inspect=0.0.0.0:1234', async () => {
      const json = await exec(
        'resolve-scripts build --start --inspect=0.0.0.0:1234'
      )

      expect(json).toHaveProperty('inspectHost', '0.0.0.0')
      expect(json).toHaveProperty('inspectPort', 1234)
    })

    test('resolve-scripts build --inspect=INCORRECT_PORT (fail)', async () => {
      expect(
        exec('resolve-scripts build --inspect=INCORRECT_PORT')
      ).rejects.toThrow()
    })

    test('resolve-scripts build --inspect=INCORRECT_HOST (fail)', async () => {
      expect(
        exec('resolve-scripts build --inspect=1.2.3.4.5:1234')
      ).rejects.toThrow()
    })

    test('resolve-scripts build --inspect (fail)', () => {
      expect(exec('resolve-scripts build --inspect')).rejects.toThrow()
    })
  })

  describe('argv.config', () => {
    test('resolve-scripts build --config=resolve.test.config.json', async () => {
      const json = await exec(
        `resolve-scripts build --config=${path.resolve(
          __dirname,
          'resolve.test.config.json'
        )}`
      )

      const { env, ...config } = require('./resolve.test.config.json')

      expect(json).toMatchObject({
        ...config,
        ...env.development
      })
    })

    test('resolve-scripts build --config=NONEXISTENT_FILE (fail)', async () => {
      expect(
        exec('resolve-scripts build --config=NONEXISTENT_FILE')
      ).rejects.toThrow()
    })
  })
})

describe('resolve-scripts dev', () => {
  describe('argv.mode', () => {
    test('resolve-scripts dev', async () => {
      const json = await exec('resolve-scripts dev')

      expect(json).toHaveProperty('build', true)
      expect(json).toHaveProperty('start', true)
      expect(json).toHaveProperty('mode', 'development')
    })
  })

  describe('argv.host', () => {
    test('resolve-scripts dev --host=http://test.test', async () => {
      const json = await exec('resolve-scripts dev --host=http://test.test')

      expect(json).toHaveProperty('start', true)
      expect(json).toHaveProperty('host', 'http://test.test')
    })
  })

  describe('argv.port', () => {
    test('resolve-scripts dev --port=1234', async () => {
      const json = await exec('resolve-scripts dev --port=1234')

      expect(json).toHaveProperty('start', true)
      expect(json).toHaveProperty('port', 1234)
    })
  })

  describe('argv.inspect', () => {
    test('resolve-scripts dev --inspect', async () => {
      const json = await exec('resolve-scripts dev --inspect')

      expect(json).toHaveProperty('inspectHost', '127.0.0.1')
      expect(json).toHaveProperty('inspectPort', 9229)
    })

    test('resolve-scripts dev --inspect=1234', async () => {
      const json = await exec('resolve-scripts dev --inspect=1234')

      expect(json).toHaveProperty('inspectHost', '127.0.0.1')
      expect(json).toHaveProperty('inspectPort', 1234)
    })

    test('resolve-scripts dev --inspect=0.0.0.0:1234', async () => {
      const json = await exec('resolve-scripts dev --inspect=0.0.0.0:1234')

      expect(json).toHaveProperty('inspectHost', '0.0.0.0')
      expect(json).toHaveProperty('inspectPort', 1234)
    })

    test('resolve-scripts dev --inspect=INCORRECT_PORT (fail)', async () => {
      expect(
        exec('resolve-scripts dev --inspect=INCORRECT_PORT')
      ).rejects.toThrow()
    })

    test('resolve-scripts dev --inspect=INCORRECT_HOST (fail)', async () => {
      expect(
        exec('resolve-scripts dev --inspect=1.2.3.4.5:1234')
      ).rejects.toThrow()
    })
  })

  describe('argv.config', () => {
    test('resolve-scripts dev --config=resolve.test.config.json', async () => {
      const json = await exec(
        `resolve-scripts dev --config=${path.resolve(
          __dirname,
          'resolve.test.config.json'
        )}`
      )

      const { env, ...config } = require('./resolve.test.config.json')

      expect(json).toMatchObject({
        ...config,
        ...env.development
      })
    })

    test('resolve-scripts dev --config=NONEXISTENT_FILE (fail)', async () => {
      expect(
        exec('resolve-scripts dev --config=NONEXISTENT_FILE')
      ).rejects.toThrow()
    })
  })
})

describe('resolve-scripts start', () => {
  describe('argv.inspect', () => {
    test('resolve-scripts start --inspect', async () => {
      const json = await exec('resolve-scripts start --inspect')

      expect(json).toHaveProperty('inspectHost', '127.0.0.1')
      expect(json).toHaveProperty('inspectPort', 9229)
    })

    test('resolve-scripts start --inspect=1234', async () => {
      const json = await exec('resolve-scripts start --inspect=1234')

      expect(json).toHaveProperty('inspectHost', '127.0.0.1')
      expect(json).toHaveProperty('inspectPort', 1234)
    })

    test('resolve-scripts start --inspect=0.0.0.0:1234', async () => {
      const json = await exec('resolve-scripts start --inspect=0.0.0.0:1234')

      expect(json).toHaveProperty('inspectHost', '0.0.0.0')
      expect(json).toHaveProperty('inspectPort', 1234)
    })

    test('resolve-scripts start --inspect=INCORRECT_PORT (fail)', async () => {
      expect(
        exec('resolve-scripts start --inspect=INCORRECT_PORT')
      ).rejects.toThrow()
    })

    test('resolve-scripts start --inspect=INCORRECT_HOST (fail)', async () => {
      expect(
        exec('resolve-scripts start --inspect=1.2.3.4.5:1234')
      ).rejects.toThrow()
    })
  })
})
