import decodeEmptyStrings from '../src/decode-empty-strings'

test('method "decodeEmptyStrings" should decode empty strings', async () => {
  const obj = {
    key1: 'text-value\u0004',
    key2: 100500,
    key3: ['text\u0004', 10, 20, null, {
      key1: 'text-value\u0004',
      key2: 100500,
      key3: ['text\u0004', 10, 20, null],
      key4: {
        key1: 500100,
        key2: 'text-value\u0004',
        key3: ['text\u0004', 10, 20, null]
      }
    }],
    key4: {
      key1: 500100,
      key2: 'text-value\u0004',
      key3: ['text\u0004', 10, 20, null],
      key4: {
        key1: 500100,
        key2: 'text-value\u0004',
        key3: ['text\u0004', 10, 20, null]
      }
    },
    key5: null
  }
  
  expect(decodeEmptyStrings(obj)).toMatchSnapshot()
})