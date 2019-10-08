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
  settings: {
    react: {
      version: '16.5'
    }
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
    'no-lone-block': 'off',
    'no-lone-blocks': 'off',
    'no-mixed-operators': 'off',
    'object-curly-spacing': ['error', 'always'],
    'no-unused-vars': ['error', { args: 'after-used' }],
    'max-len': 'off',
    'no-control-regex': 'off',
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
          'alloc',
          'ajv',
          'amqp',
          'amqplib',
          'analytics',
          'anycast',
          'api',
          'apis',
          'applicationautoscaling',
          'appspot',
          'arg',
          'args',
          'argv',
          'arn',
          'askstories',
          'async',
          'auth',
          'autoload',
          'autoprefixer',
          'aws',
          'awslambda',
          'babelify',
          'babelrc',
          'backend',
          'basename',
          'behaviour',
          'bool',
          'bson',
          'btn',
          'buf',
          'calc',
          'cax',
          'cdn',
          'chai',
          'chainable',
          'charset',
          'checkbox',
          'cjs',
          'cli',
          'cloudwatch',
          'columnify',
          'cmd',
          'codeload',
          'Codepage',
          'commonjs',
          'config',
          'configs',
          'connack',
          'const',
          'Cooldown',
          'corejs',
          'cron',
          'cpus',
          'cqrs',
          'cte',
          'cuid',
          'cwd',
          'dateformat',
          'darwin',
          'dddddd',
          'ddd',
          'decrement',
          'deepmerge',
          'del',
          'desc',
          'deserialize',
          'deserialized',
          'deserializer',
          'deserializers',
          'dev',
          'devtool',
          'devtools',
          'dir',
          'dirname',
          'dns',
          'doctype',
          'docusaurus',
          'dom',
          'dotenv',
          'downvote',
          'dup',
          'dynamodb',
          'ecma',
          'elasticsearch',
          'encodings',
          'envs',
          'eqeqeq',
          'eql',
          'eol',
          'errno',
          'escaper',
          'escaperegexp',
          'eslint',
          'eventstore',
          'execpath',
          'expr',
          'extname',
          'facebook',
          'fanout',
          'fas',
          'favicon',
          'faq',
          'fff',
          'ffffff',
          'filename',
          'filenames',
          'firebase',
          'firebaseio',
          'fontawesome',
          'formatter',
          'func',
          'github',
          'gte',
          'guid',
          'gzip',
          'hmac',
          'hmr',
          'hostname',
          'href',
          'html',
          'http',
          'https',
          'ico',
          'iconv',
          'ident',
          'idx',
          'Img',
          'img',
          'impl',
          'indexreadpolicy',
          'indexwritepolicy',
          'init',
          'inline',
          'inlined',
          'inlines',
          'Inno',
          'instanceof',
          'interop',
          'invoker',
          'Ionicons',
          'ios',
          'Iot',
          'IotData',
          'iotdevicegateway',
          'iterable',
          'Jitter',
          'jpg',
          'jpeg',
          'jsdom',
          'jsonb',
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
          'lockfile',
          'lstat',
          'lte',
          'Mergeable',
          'metadata',
          'middleware',
          'middlewares',
          'millis',
          'minimist',
          'mongo',
          'mongodb',
          'monorepo',
          'Monorepos',
          'mqtt',
          'msg',
          'mysql',
          'namespace',
          'namespaces',
          'nav',
          'navbar',
          'ndjson',
          'nedb',
          'newstories',
          'noop',
          'noopener',
          'noreferrer',
          'noredirect',
          'npm',
          'npmjs',
          'npx',
          'nspname',
          'nullable',
          'nullish',
          'obj',
          'objoid',
          'objs',
          'octicon',
          'oid',
          'oper',
          'opn',
          'osascript',
          'palevioletred',
          'papayawhip',
          'param',
          'parameterized',
          'params',
          'pathname',
          'pid',
          'pingreq',
          'pingresp',
          'png',
          'polyfill',
          'polyfills',
          'postcss',
          'postgres',
          'postgresql',
          'prefetch',
          'Postfix',
          'preloader',
          'Presigned',
          'prev',
          'println',
          'proc',
          'processlist',
          'promisify',
          'proto',
          'pubsub',
          'qos',
          'rabbitmq',
          'raf',
          'react',
          'reactivity',
          'readdir',
          'readmodel',
          'readpolicy',
          'resetter',
          'realtime',
          'redux',
          'rdsdataservice',
          'rds',
          'referer',
          'refman',
          'regenerator',
          'reimagined',
          'relnamespace',
          'relname',
          'relkind',
          'remotedev',
          'renderer',
          'Renderless',
          'renderless',
          'repo',
          'req',
          'res',
          'resolvejs',
          'resolver',
          'resolvers',
          'respawn',
          'rgba',
          'rmdir',
          'Roboto',
          'runtime',
          'sanitizer',
          'scalable',
          'sdk',
          'sep',
          'serializable',
          'Serializers',
          'serializer',
          'serverless',
          'setsockopt',
          'sha512',
          'Sharings',
          'shm',
          'showstories',
          'sinon',
          'sitemap',
          'socktype',
          'splitter',
          'sql',
          'sqlite',
          'squaremobius',
          'src',
          'stackoverflow',
          'stderr',
          'stdin',
          'stdout',
          'str',
          'stringified',
          'sts',
          'stepfunctions',
          'suback',
          'subdirectory',
          'subsegment',
          'subsegments',
          'subquery',
          'svg',
          'symlink',
          'tagline',
          'tcp',
          'testcafe',
          'textarea',
          'transactionid',
          'tgz',
          'Timeframe',
          'timestamp',
          'tmp',
          'todo',
          'todolist',
          'todos',
          'topstories',
          'Transactional',
          'truthy',
          'ttf',
          'ttl',
          'txid',
          'txt',
          'typeof',
          'uglify',
          'undef',
          'unfetch',
          'unicode',
          'unlink',
          'unmarshall',
          'unmocked',
          'unmount',
          'unordered',
          'unserializable',
          'unshare',
          'unshift',
          'unsuback',
          'unsubscribe',
          'unsubscription',
          'unsubscriptions',
          'unvote',
          'unvoted',
          'upsert',
          'upvote',
          'upvoted',
          'uri',
          'url',
          'urlencoded',
          'urls',
          'usename',
          'usr',
          'utf',
          'utf8mb4',
          'util',
          'utils',
          'uuid',
          'validator',
          'verdana',
          'viewmodel',
          'viewport',
          'wal',
          'webpack',
          'websockets',
          'whitelist',
          'wikipedia',
          'wildcard',
          'workspaces',
          'writepolicy',
          'wss',
          'www',
          'xcopy',
          'xpub',
          'xray',
          'xsub',
          'xyz',
          'yargs',
          'ycombinator',
          'zeromq',
          'zmq',
          'zlib',
          'compat'
        ],
        minLength: 3
      }
    ]
  }
}
