const buildInApiHandlers = [
  {
    path: '/api/query/:wildcard*',
    handler: 'QUERY',
    method: 'GET',
  },
  {
    path: '/api/query/:wildcard*',
    handler: 'QUERY',
    method: 'POST',
  },
  {
    path: '/api/query',
    handler: 'QUERY',
    method: 'GET',
  },
  {
    path: '/api/query',
    handler: 'QUERY',
    method: 'POST',
  },
  {
    path: '/api/commands/:wildcard*',
    handler: 'COMMAND',
    method: 'POST',
  },
  {
    path: '/api/commands',
    handler: 'COMMAND',
    method: 'POST',
  },
  {
    path: '/uploader',
    handler: 'UPLOADER',
    method: 'OPTIONS',
  },
  {
    path: '/uploader',
    handler: 'UPLOADER',
    method: 'POST',
  },
  {
    path: '/uploader',
    handler: 'UPLOADER',
    method: 'PUT',
  },
  {
    path: '/uploader/:params*',
    handler: 'UPLOADER',
    method: 'GET',
  },
]

export default buildInApiHandlers
