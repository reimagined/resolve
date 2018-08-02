import { getInstallations } from 'testcafe-browser-tools'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import postcssImport from 'postcss-import'
import autoprefixer from 'autoprefixer'
import { execSync } from 'child_process'

import { defaultResolveConfig, build, start, watch } from 'resolve-scripts'

const adjustWebpackConfigs = webpackConfigs => {
  for (const webpackConfig of webpackConfigs) {
    webpackConfig.module.rules.push({
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: [postcssImport(), autoprefixer()]
            }
          }
        ]
      })
    })

    webpackConfig.plugins.push(
      new ExtractTextPlugin({
        filename: 'style.css',
        allChunks: true
      })
    )
  }
}

const config = {
  ...defaultResolveConfig,
  port: 3000,
  routes: 'client/routes.js'
}

async function main() {
  const launchMode = process.argv[2]

  switch (launchMode) {
    case 'dev': {
      await watch(
        {
          ...config,
          mode: 'development'
        },
        adjustWebpackConfigs
      )
      break
    }

    case 'build': {
      await build(
        {
          ...config,
          mode: 'production'
        },
        adjustWebpackConfigs
      )
      break
    }

    case 'start': {
      await start(config)

      break
    }

    default: {
      throw new Error('Unknown option')
    }
  }
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
})
