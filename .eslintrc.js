const typescriptEslintRecommended = require('@typescript-eslint/eslint-plugin')
  .configs.recommended

module.exports = {
  env: {
    node: true,
    jest: true,
    jasmine: true,
    es6: true,
    browser: true,
  },
  extends: ['react-app', 'plugin:prettier/recommended'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeature: {
      jsx: true,
    },
  },
  plugins: ['react', 'jsx-a11y', 'import', 'spellcheck'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:import/typescript'],
      rules: Object.assign({}, typescriptEslintRecommended.rules, {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/member-delimiter-style': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'no-redeclare': 'off',
      }),
    },
  ],
  rules: {
    'react-hooks/exhaustive-deps': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'func-names': 'off',
    'no-underscore-dangle': 'off',
    'import/no-unresolved': 'off',
    'comma-dangle': 'off',
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
          'redeclare',
          'plusplus',
          'lang',
          'allowlist',
          'aes',
          'acc',
          'ack',
          'acls',
          'adm',
          'alloc',
          'ajv',
          'amazonaws',
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
          'cancelled',
          'cacheable',
          'calc',
          'cax',
          'cdn',
          'chai',
          'chainable',
          'charset',
          'checkbox',
          'cjs',
          'cli',
          'cloudfront',
          'cloudwatch',
          'columnify',
          'cmd',
          'codeload',
          'Codepage',
          'commiting',
          'commonjs',
          'config',
          'configs',
          'connack',
          'const',
          'Cooldown',
          'corejs',
          'cors',
          'cron',
          'cpus',
          'cqrs',
          'cte',
          'cuid',
          'cumulate',
          'cumulated',
          'cwd',
          'cryptr',
          'dateformat',
          'darwin',
          'dddddd',
          'ddd',
          'decrement',
          'decrypt',
          'decryptor',
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
          'domready',
          'dotenv',
          'downvote',
          'dropdown',
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
          'Escapeable',
          'escaper',
          'escaperegexp',
          'encrypter',
          'decrypter',
          'eslint',
          'esm',
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
          'fileupload',
          'firebase',
          'firebaseio',
          'fontawesome',
          'formatter',
          'fpr',
          'func',
          'getter',
          'githubusercontent',
          'github',
          'gte',
          'gif',
          'guid',
          'gzip',
          'globals',
          'Highload',
          'hmac',
          'hmr',
          'hostname',
          'href',
          'html',
          'http',
          'https',
          'hoc',
          'ico',
          'iconv',
          'ident',
          'idx',
          'iife',
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
          'iots',
          'IotData',
          'iotdevicegateway',
          'iterable',
          'Jitter',
          'jpg',
          'jpeg',
          'js',
          'jsdom',
          'jsonb',
          'jsons',
          'jsonschema',
          'jsonwebtoken',
          'jsx',
          'jwt',
          'latin1',
          'lan',
          'len',
          'libs',
          'lifecycle',
          'linearized',
          'localhost',
          'lodash',
          'lockfile',
          'lstat',
          'lte',
          'Marshalled',
          'md5',
          'Mergeable',
          'metadata',
          'middleware',
          'middlewares',
          'millis',
          'minimist',
          'monorepo',
          'Monorepos',
          'mqtt',
          'multer',
          'multipart',
          'mutex',
          'msg',
          'mysql',
          'mjs',
          'nanoid',
          'namespace',
          'namespaces',
          'nav',
          'navbar',
          'ndjson',
          'nedb',
          'Newable',
          'newstories',
          'ngtools',
          'noop',
          'noopener',
          'noreferrer',
          'noredirect',
          'npm',
          'npmjs',
          'npmrc',
          'npx',
          'nspname',
          'nullable',
          'nullish',
          'num',
          'obj',
          'objoid',
          'objs',
          'octicon',
          'onopen',
          'onerror',
          'onmessage',
          'onclose',
          'oid',
          'oper',
          'opn',
          'osascript',
          'palevioletred',
          'papayawhip',
          'param',
          'parameterized',
          'params',
          'passthrough',
          'pathname',
          'pid',
          'pingreq',
          'pingresp',
          'plv8',
          'png',
          'polyfill',
          'polyfills',
          'postcss',
          'postgres',
          'postgresql',
          'prefetch',
          'principial',
          'Postfix',
          'Postgre',
          'pre',
          'preloader',
          'Presigned',
          'prev',
          'println',
          'proc',
          'processlist',
          'profiler',
          'promisify',
          'proto',
          'pubsub',
          'purtuga',
          'qos',
          'querystring',
          'rabbitmq',
          'raf',
          'react',
          'reactstrap',
          'reactivity',
          'readdir',
          'readmodel',
          'readpolicy',
          'resetter',
          'rerender',
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
          'Retryable',
          'rgba',
          'rmdir',
          'rollbacking',
          'rowid',
          'Roboto',
          'rpc',
          'runtime',
          'sanitizer',
          'savepoint',
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
          'sni',
          'socktype',
          'splitter',
          'sql',
          'sqlite',
          'squaremobius',
          'sqs',
          'src',
          'ssl',
          'ssr',
          'stackoverflow',
          'stderr',
          'stdin',
          'stdout',
          'str',
          'stringified',
          'strftime',
          'sts',
          'stepfunctions',
          'suback',
          'subdirectory',
          'submenu',
          'subsegment',
          'subsegments',
          'subquery',
          'svg',
          'symlink',
          'tagline',
          'tcp',
          'testcafe',
          'textarea',
          'tmpdir',
          'transactionid',
          'tgz',
          'timestamp',
          'timestamps',
          'tmp',
          'todo',
          'todolist',
          'todos',
          'topstories',
          'Transactional',
          'trx',
          'tsc',
          'trie',
          'truthy',
          'ttf',
          'ttl',
          'tsconfig',
          'tsr',
          'tsx',
          'txid',
          'txt',
          'typeof',
          'uglify',
          'unbrand',
          'undef',
          'unfetch',
          'unicode',
          'Uint8Array',
          'unlink',
          'unmarshall',
          'unmocked',
          'unmount',
          'Unpromise',
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
          'uploader',
          'unhandled',
          'unprocessable',
          'invokers',
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
          'variadic',
          'validator',
          'verdana',
          'viewmodel',
          'viewport',
          'vue',
          'wal',
          'webpack',
          'websockets',
          'whitelist',
          'wikipedia',
          'wildcard',
          'workspaces',
          'workspace',
          'writepolicy',
          'wss',
          'www',
          'xcopy',
          'xpub',
          'xray',
          'xsub',
          'xvfb',
          'xyz',
          'yargs',
          'yarnpkg',
          'ycombinator',
          'zeromq',
          'zmq',
          'zlib',
          'compat',
          'dep',
          'uniq',
          'micromatch',
          'rimraf',
        ],
        minLength: 3,
      },
    ],
  },
}
