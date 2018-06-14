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
  globals: {
    $resolve: true
  },
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
      'error',
      {
        code: 100
      }
    ],
    'no-console': ['error'],
    'spellcheck/spell-checker': [
      1,
      {
        comments: true,
        strings: true,
        identifiers: true,
        lang: 'en_US',
        skipWordIfMatch: ['^[^A-Za-z_]'],
        skipWords: [
          'acc',
          'ack',
          'adm',
          'amqp',
          'amqplib',
          'analytics',
          'api',
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
          'basename',
          'buf',
          'calc',
          'cax',
          'cdn',
          'chai',
          'chainable',
          'checkbox',
          'cli',
          'cmd',
          'codeload',
          'config',
          'configs',
          'cwd',
          'darwin',
          'dev',
          'doctype',
          'dom',
          'del',
          'devtool',
          'devtools',
          'desc',
          'deserialize',
          'dir',
          'dns',
          'dotenv',
          'downvote',
          'eslint',
          'eql',
          'escaper',
          'execpath',
          'expr',
          'facebook',
          'fanout',
          'filename',
          'firebase',
          'firebaseio',
          'fff',
          'formatter',
          'func',
          'github',
          'gte',
          'hostname',
          'html',
          'href',
          'http',
          'https',
          'idx',
          'impl',
          'init',
          'inline',
          'inlines',
          'instanceof',
          'invoker',
          'iterable',
          'jsonschema',
          'jsonwebtoken',
          'jwt',
          'lan',
          'len',
          'localhost',
          'lodash',
          'lte',
          'middleware',
          'middlewares',
          'mongo',
          'mongodb',
          'monorepo',
          'mqtt',
          'msg',
          'mysql',
          'namespace',
          'nav',
          'navbar',
          'nedb',
          'newstories',
          'npm',
          'npmjs',
          'npx',
          'nullable',
          'obj',
          'objs',
          'oper',
          'opn',
          'osascript',
          'pathname',
          'palevioletred',
          'papayawhip',
          'param',
          'params',
          'pid',
          'plur',
          'png',
          'polyfill',
          'postcss',
          'prev',
          'println',
          'proc',
          'proto',
          'rabbitmq',
          'react',
          'reactivity',
          'readmodel',
          'redux',
          'regenerator',
          'reimagined',
          'reinitialization',
          'renderer',
          'repo',
          'req',
          'res',
          'respawn',
          'resolvejs',
          'resolver',
          'resolvers',
          'rmdir',
          'runtime',
          'sanitizer',
          'svg',
          'serializable',
          'sinon',
          'scalable',
          'setsockopt',
          'showstories',
          'socktype',
          'splitter',
          'sql',
          'squaremobius',
          'src',
          'stderr',
          'stdin',
          'stdout',
          'subdirectory',
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
          'ttl',
          'txt',
          'verdana',
          'viewport',
          'undef',
          'unicode',
          'unlink',
          'unmount',
          'unvote',
          'unvoted',
          'upvote',
          'upvoted',
          'url',
          'urlencoded',
          'urls',
          'usr',
          'util',
          'utils',
          'utf',
          'uuid',
          'webpack',
          'wikipedia',
          'wildcard',
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
