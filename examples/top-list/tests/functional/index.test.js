import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`
const INSPECT_PAGE_COUNT = 5
const INSPECT_MATCH_TIMES = 5

const createSequence = count =>
  Array.from(new Array(count)).map((_, idx) => idx)

const loopAsync = async (count, fn) =>
  await createSequence(count).reduce(
    (acc, val) => acc.then(fn.bind(null, val)),
    Promise.resolve()
  )

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout))

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`News`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('should be reactive', async t => {
  await loopAsync(2, async dirIdx => {
    const forwardDirection = !dirIdx

    await loopAsync(INSPECT_PAGE_COUNT - 1, async pageIdx => {
      const page = forwardDirection ? pageIdx + 1 : INSPECT_PAGE_COUNT - pageIdx
      // eslint-disable-next-line no-console
      console.log(
        `Inspecting ${page} from ${INSPECT_PAGE_COUNT} in ${
          forwardDirection ? 'forward' : 'backward'
        } direction`
      )

      await loopAsync(INSPECT_MATCH_TIMES, async () => {
        const actualRatings = (await Selector('section').innerText)
          .split(/\n/g)
          .map(row => row.trim())
          .reverse()
          .slice(1)
          .map(row => row.replace(/^.*?\((\d+?)\s*?votes\s*?\).*?$/g, '$1'))
          .map(rating => parseInt(rating, 10))

        await t
          .expect(
            actualRatings
              .slice(1)
              .reduce((acc, val, idx) => acc && val >= actualRatings[idx], true)
          )
          .eql(true)

        await delay(100)
      })

      await t.click(
        await Selector('button').nth(
          forwardDirection ? pageIdx + 1 : pageIdx - 1
        )
      )

      await delay(100)
    })
  })
})
