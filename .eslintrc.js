module.exports = {
  env: {
    node: true,
    jest: true,
    es6: true
  },
  extends: 'react-app',
  parserOptions: {
    ecmaFeature: {
      jsx: true
    }
  },
  plugins: ['react', 'jsx-a11y', 'import', 'spellcheck'],
  rules: {
    'func-names': 'off',
    'no-underscore-dangle': 'off',
    'import/no-unresolved': 'off',
    'comma-dangle': ['error', 'never'],
    'no-plusplus': 'off',
    'jsx-a11y/href-no-hash': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'no-param-reassign': ['error', { props: false }],
    'new-cap': ['error', { capIsNew: false }],
    'no-mixed-operators': [
      'error',
      {
        allowSamePrecedence: true
      }
    ],
    'object-curly-spacing': ['error', 'always'],
    'no-unused-vars': ['error', { args: 'after-used' }],
    'max-len': [
      'warn',
      {
        code: 100,
        comments: 10000
      }
    ],
    'eol-last': ['error', 'always'],
    'no-console': ['error'],
    'spellcheck/spell-checker': [
      'error',
      {
        comments: false,
        strings: true,
        identifiers: true,
        lang: 'en_US',
        skipWordIfMatch: ['^[^A-Za-z_]'],
        skipWords: [
          'acc',
          'ack',
          'adm',
          'ajv',
          'amqp',
          'amqplib',
          'analytics',
          'api',
          'apis',
          'Apis',
          'applescript',
          'appspot',
          'arg',
          'args',
          'argv',
          'askstories',
          'async',
          'auth',
          'autoload',
          'autoprefixer',
          'awslambda',
          'basename',
          'babelrc',
          'behaviour',
          'bson',
          'bool',
          'buf',
          'btn',
          'calc',
          'cax',
          'cdn',
          'chai',
          'chainable',
          'checkbox',
          'cli',
          'cmd',
          'codeload',
          'commonjs',
          'config',
          'configs',
          'connack',
          'const',
          'corejs',
          'cron',
          'cjs',
          'cwd',
          'darwin',
          'dddddd',
          'dev',
          'doctype',
          'dom',
          'del',
          'devtool',
          'devtools',
          'deepmerge',
          'desc',
          'deserialize',
          'deserialized',
          'deserializer',
          'deserializers',
          'dir',
          'dirname',
          'dns',
          'dotenv',
          'downvote',
          'dup',
          'eqeqeq',
          'eslint',
          'ecma',
          'eql',
          'errno',
          'eventstore',
          'escaper',
          'escaperegexp',
          'execpath',
          'expr',
          'extname',
          'favicon',
          'facebook',
          'fanout',
          'fas',
          'filename',
          'filenames',
          'firebase',
          'firebaseio',
          'fff',
          'ffffff',
          'formatter',
          'fontawesome',
          'func',
          'github',
          'gte',
          'hmr',
          'hmac',
          'hostname',
          'html',
          'href',
          'http',
          'https',
          'ico',
          'idx',
          'Ionicons',
          'ios',
          'img',
          'Img',
          'impl',
          'init',
          'inline',
          'inlines',
          'inlined',
          'instanceof',
          'interop',
          'invoker',
          'iterable',
          'jpg',
          'jsons',
          'jsonschema',
          'jsonwebtoken',
          'jwt',
          'lan',
          'len',
          'libs',
          'linearized',
          'localhost',
          'lodash',
          'lte',
          'middleware',
          'middlewares',
          'minimist',
          'mongo',
          'mongodb',
          'monorepo',
          'Monorepos',
          'mqtt',
          'msg',
          'mysql',
          'namespace',
          'nav',
          'navbar',
          'nedb',
          'newstories',
          'noop',
          'npm',
          'npmjs',
          'npx',
          'nullable',
          'nullish',
          'obj',
          'objs',
          'oper',
          'opn',
          'osascript',
          'pathname',
          'palevioletred',
          'papayawhip',
          'param',
          'parameterized',
          'params',
          'pid',
          'pingreq',
          'pingresp',
          'plur',
          'png',
          'polyfill',
          'polyfills',
          'postcss',
          'preloader',
          'prefetch',
          'prev',
          'println',
          'proc',
          'proto',
          'pubsub',
          'qos',
          'rabbitmq',
          'raf',
          'react',
          'reactivity',
          'readdir',
          'readmodel',
          'redux',
          'regenerator',
          'refman',
          'reimagined',
          'reinitialization',
          'renderer',
          'renderless',
          'Renderless',
          'repo',
          'req',
          'res',
          'respawn',
          'resolvejs',
          'resolver',
          'resolvers',
          'rgba',
          'rmdir',
          'runtime',
          'Roboto',
          'sanitizer',
          'svg',
          'serializable',
          'sinon',
          'scalable',
          'sep',
          'setsockopt',
          'showstories',
          'socktype',
          'splitter',
          'sql',
          'squaremobius',
          'src',
          'sha512',
          'Sharings',
          'str',
          'stderr',
          'stdin',
          'stdout',
          'subdirectory',
          'suback',
          'Tablename',
          'tcp',
          'testcafe',
          'textarea',
          'timestamp',
          'topstories',
          'tmp',
          'todo',
          'todolist',
          'todos',
          'truthy',
          'ttf',
          'ttl',
          'txt',
          'typeof',
          'verdana',
          'viewport',
          'wss',
          'unserializable',
          'undef',
          'unicode',
          'unlink',
          'unmount',
          'unmocked',
          'unshare',
          'unshift',
          'unvote',
          'unvoted',
          'unsubscribe',
          'unsubscription',
          'unsubscriptions',
          'unsuback',
          'upsert',
          'upvote',
          'upvoted',
          'utf8mb4',
          'url',
          'urlencoded',
          'urls',
          'usr',
          'util',
          'utils',
          'utf',
          'uuid',
          'validator',
          'webpack',
          'wikipedia',
          'wildcard',
          'workspaces',
          'www',
          'xcopy',
          'xpub',
          'xsub',
          'xyz',
          'yargs',
          'ycombinator',
          'zeromq',
          'zmq'
        ],
        minLength: 3
      }
    ]
  }
}
