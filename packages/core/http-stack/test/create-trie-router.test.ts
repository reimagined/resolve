import createTrieRouter from '../src/create-trie-router'

test('method "create-trie-router" should work correctly', () => {
  expect(
    createTrieRouter({
      routes: [
        {
          method: 'GET',
          pattern: '/a',
          handler: (req, res) => {
            res.end()
          },
        },
        {
          method: 'GET',
          pattern: '/a',
          handler: (req, res) => {
            res.end()
          },
          optional: true,
        },
      ],
    })
  ).toEqual(expect.any(Function))

  expect(() =>
    createTrieRouter({
      routes: [
        {
          method: 'GET',
          pattern: '/a',
          handler: (req, res) => {
            res.end()
          },
        },
        {
          method: 'GET',
          pattern: '/a',
          handler: (req, res) => {
            res.end()
          },
        },
      ],
    })
  ).toThrow()

  expect(
    createTrieRouter({
      cors: { origin: true },
      routes: [
        {
          method: 'GET',
          pattern: '/a',
          handler: (req, res) => {
            res.end()
          },
        },
        {
          method: 'OPTIONS',
          pattern: '/a',
          handler: (req, res) => {
            res.end()
          },
        },
      ],
    })
  ).toEqual(expect.any(Function))
})
