import 'core-js/es/reflect'
import 'core-js/stable/reflect'
import 'core-js/features/reflect'
import 'zone.js/dist/zone'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { AppModule } from './app/app.module'

async function entryPoint({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rootPath,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  staticPath,
}: {
  rootPath: string
  staticPath: string
}): Promise<void> {
  try {
    const appRoot = document.createElement('app-root')
    appRoot.setAttribute('id', 'app-root')
    document.body.appendChild(appRoot)

    await platformBrowserDynamic().bootstrapModule(AppModule)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

export default entryPoint
