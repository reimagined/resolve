import 'core-js/es/reflect'
import 'core-js/stable/reflect'
import 'core-js/features/reflect'
import 'zone.js/dist/zone'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { AppModule } from './app/app.module'

const entryPoint = async ({ rootPath, staticPath }: { rootPath: string, staticPath: string }) => {
  try {
    const appRoot = document.createElement('app-root')
    appRoot.setAttribute('id', 'app-root')
    document.body.appendChild(appRoot)

    await platformBrowserDynamic().bootstrapModule(AppModule)
  } catch(error) {
    console.error(error)
  }
}

export default entryPoint
