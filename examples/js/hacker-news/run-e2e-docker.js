import { execSync } from 'child_process'
void (async () => {
  if (process.env.RESOLVE_E2E_TESTS_BROWSER == null) {
    throw new Error('RESOLVE_E2E_TESTS_BROWSER env is required')
  }
  const headlessMode = ['true', 'yes', '1'].includes(
    process.env.RESOLVE_E2E_TESTS_HEADLESS_MODE
  )
  execSync(
    [
      headlessMode ? `xvfb-run --server-args="-screen 0 1280x720x24"` : '',
      `npx testcafe ${process.env.RESOLVE_E2E_TESTS_BROWSER}`,
      `test/e2e-docker`,
      process.env.DEBUG_LEVEL === 'debug' ? '--dev' : '',
    ].join(' '),
    { stdio: 'inherit' }
  )
})()
