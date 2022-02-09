/* eslint-disable spellcheck/spell-checker */

export const POST_REQUEST_CLOUD_FRONT_EVENT = {
  version: '1.0',
  context: {
    distributionDomainName: 'di0f6qaghmhnk.cloudfront.net',
    distributionId: 'E1Q493KX16BVSN',
    eventType: 'viewer-request',
    requestId: 'Qd7RW8CYUgw_kppJUeBed94eZ_gtI3fgFyxaNytQKbsv7wZ_4KRnlQ==',
  },
  viewer: {
    ip: '188.128.36.80',
  },
  request: {
    method: 'POST',
    uri: '/some-path',
    querystring: {},
    headers: {
      'user-agent': {
        value:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
      },
      origin: {
        value: 'https://domain.stage.resolve.fit',
      },
      'sec-ch-ua-mobile': {
        value: '?0',
      },
      'cache-control': {
        value: 'no-cache',
      },
      referer: {
        value: 'https://domain.stage.resolve.fit/some-path?a[]=1&a[]=2&b=qqq',
      },
      host: {
        value: 'domain.stage.resolve.fit',
      },
      accept: {
        value: '*/*',
      },
      'sec-fetch-site': {
        value: 'same-origin',
      },
      'sec-fetch-dest': {
        value: 'empty',
      },
      'accept-language': {
        value: 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6',
      },
      'accept-encoding': {
        value: 'gzip, deflate, br',
      },
      'content-length': {
        value: '0',
      },
      pragma: {
        value: 'no-cache',
      },
      'sec-ch-ua-platform': {
        value: '"Linux"',
      },
      'sec-ch-ua': {
        value:
          '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
      },
      'sec-fetch-mode': {
        value: 'cors',
      },
    },
    cookies: {
      'some-cookie': {
        value: 'some-value',
      },
    },
  },
}

export const POST_REQUEST = {
  version: '2.0',
  routeKey: 'ANY /domain.stage.resolve.fit/{thepath+}',
  rawPath: '/domain.stage.resolve.fit/some-path',
  rawQueryString: '',
  cookies: ['some-cookie=some-value'],
  headers: {
    'cache-control': 'no-cache',
    'content-length': '0',
    host: 'gzgcslmyui.execute-api.eu-central-1.amazonaws.com',
    origin: 'https://domain.stage.resolve.fit',
    pragma: 'no-cache',
    'user-agent': 'Amazon CloudFront',
    via: '2.0 27a205ba0937fb032aa2efb66ec66a80.cloudfront.net (CloudFront)',
    'x-amz-cf-id': 'Qd7RW8CYUgw_kppJUeBed94eZ_gtI3fgFyxaNytQKbsv7wZ_4KRnlQ==',
    'x-amzn-trace-id': 'Root=1-61e02a77-11f183095d1b93d11327a4b5',
    'x-cloudfront-event': JSON.stringify(POST_REQUEST_CLOUD_FRONT_EVENT),
    'x-forwarded-for': '188.128.36.80, 130.176.215.53',
    'x-forwarded-port': '443',
    'x-forwarded-proto': 'https',
  },
  requestContext: {
    accountId: '469403232873',
    apiId: 'gzgcslmyui',
    domainName: 'gzgcslmyui.execute-api.eu-central-1.amazonaws.com',
    domainPrefix: 'gzgcslmyui',
    http: {
      method: 'POST',
      path: '/domain.stage.resolve.fit/some-path',
      protocol: 'HTTP/1.1',
      sourceIp: '188.128.36.80',
      userAgent: 'Amazon CloudFront',
    },
    requestId: 'L4uSuiY0FiAEJaw=',
    routeKey: 'ANY /domain.stage.resolve.fit/{wildcard+}',
    stage: '$default',
    time: '13/Jan/2022:13:34:47 +0000',
    timeEpoch: 1642080887686,
  },
  pathParameters: { wildcard: 'some-path' },
  body: 'HELLO',
  isBase64Encoded: false,
}

export const GET_REQUEST_CLOUD_FRONT_EVENT = {
  version: '1.0',
  context: {
    distributionDomainName: 'di0f6qaghmhnk.cloudfront.net',
    distributionId: 'E1Q493KX16BVSN',
    eventType: 'viewer-request',
    requestId: 'V4Xscxmd4bL2IOs6aUiphr6EwNU5ZXyIaQJ7QjuZkJ9oNaSUpOSSPQ==',
  },
  viewer: {
    ip: '188.128.36.80',
  },
  request: {
    method: 'GET',
    uri: '/some-path',
    querystring: {
      'a[]': {
        value: '1',
        multiValue: [
          {
            value: '1',
          },
          {
            value: '2',
          },
        ],
      },
      b: {
        value: '42',
      },
    },
    headers: {
      'user-agent': {
        value:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
      },
      'sec-ch-ua-mobile': {
        value: '?0',
      },
      'cache-control': {
        value: 'no-cache',
      },
      host: {
        value: 'domain.stage.resolve.fit',
      },
      accept: {
        value:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
      'upgrade-insecure-requests': {
        value: '1',
      },
      'sec-fetch-site': {
        value: 'none',
      },
      'sec-fetch-dest': {
        value: 'document',
      },
      'accept-language': {
        value: 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6',
      },
      'accept-encoding': {
        value: 'gzip, deflate, br',
      },
      pragma: {
        value: 'no-cache',
      },
      'sec-ch-ua-platform': {
        value: '"Linux"',
      },
      'sec-fetch-user': {
        value: '?1',
      },
      'sec-ch-ua': {
        value:
          '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
      },
      'sec-fetch-mode': {
        value: 'navigate',
      },
    },
    cookies: {
      'some-cookie': {
        value: 'some-value',
      },
    },
  },
}

export const GET_REQUEST = {
  version: '2.0',
  routeKey: 'ANY /domain.stage.resolve.fit/{wildcard+}',
  rawPath: '/domain.stage.resolve.fit/some-path',
  rawQueryString: 'a[]=1&a[]=2&b=42',
  cookies: ['some-cookie=some-value'],
  headers: {
    'cache-control': 'no-cache',
    'content-length': '0',
    host: 'gzgcslmyui.execute-api.eu-central-1.amazonaws.com',
    pragma: 'no-cache',
    'user-agent': 'Amazon CloudFront',
    via: '2.0 809c299e67c4ffca3db95351c7287bd8.cloudfront.net (CloudFront)',
    'x-amz-cf-id': 'V4Xscxmd4bL2IOs6aUiphr6EwNU5ZXyIaQJ7QjuZkJ9oNaSUpOSSPQ==',
    'x-amzn-trace-id': 'Root=1-61e0116e-42690b7746e0473d6efdee3e',
    'x-cloudfront-event': JSON.stringify(GET_REQUEST_CLOUD_FRONT_EVENT),
    'x-forwarded-for': '188.128.36.80, 130.176.215.47',
    'x-forwarded-port': '443',
    'x-forwarded-proto': 'https',
  },
  queryStringParameters: { 'a[]': '1,2', b: '42' },
  requestContext: {
    accountId: '469403232873',
    apiId: 'gzgcslmyui',
    domainName: 'gzgcslmyui.execute-api.eu-central-1.amazonaws.com',
    domainPrefix: 'gzgcslmyui',
    http: {
      method: 'GET',
      path: '/domain.stage.resolve.fit/some-path',
      protocol: 'HTTP/1.1',
      sourceIp: '188.128.36.80',
      userAgent: 'Amazon CloudFront',
    },
    requestId: 'L4epSjNfFiAEPyw=',
    routeKey: 'ANY /domain.stage.resolve.fit/{wildcard+}',
    stage: '$default',
    time: '13/Jan/2022:11:47:58 +0000',
    timeEpoch: 1642074478425,
  },
  pathParameters: { wildcard: 'some-path' },
  isBase64Encoded: false,
}
