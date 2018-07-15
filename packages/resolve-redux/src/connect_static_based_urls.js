import React from 'react'

import getStaticBasedUrl from './get_static_based_url'
import { Consumer } from './resolve_context'
import * as validate from './validate'

const connectStaticBasedUrls = propsList => Component => {
  validate.arrayOfString(propsList, 'Props list')

  const propsListSize = propsList.length

  return class StaticBasedComponent extends React.PureComponent {
    functionAsChildComponent = ({
      origin = '',
      rootPath = '',
      staticPath = 'static'
    } = {}) => {
      const props = this.props

      const staticBasedProps = {}

      for (
        let propertyIndex = 0;
        propertyIndex < propsListSize;
        propertyIndex++
      ) {
        const propertyName = propsList[propertyIndex]
        const propertyValue = props[propertyName]
        if (Array.isArray(propertyValue)) {
          const subProps = []
          const subPropertySize = propertyValue.length
          for (
            let subPropertyIndex = 0;
            subPropertyIndex < subPropertySize;
            subPropertyIndex++
          ) {
            subProps[subPropertyIndex] = getStaticBasedUrl(
              origin,
              rootPath,
              staticPath,
              propertyValue[subPropertyIndex]
            )
          }
          staticBasedProps[propertyName] = subProps
        } else {
          staticBasedProps[propertyName] = getStaticBasedUrl(
            origin,
            rootPath,
            staticPath,
            propertyValue
          )
        }
      }

      return <Component {...props} {...staticBasedProps} />
    }

    render() {
      return <Consumer>{this.functionAsChildComponent}</Consumer>
    }
  }
}

export default connectStaticBasedUrls
