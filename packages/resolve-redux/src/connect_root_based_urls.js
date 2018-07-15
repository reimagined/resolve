import React from 'react'

import getRootBasedUrl from './get_root_based_url'
import { Consumer } from './resolve_context'
import * as validate from './validate'

const connectRootBasedUrls = propsList => Component => {
  validate.arrayOfString(propsList, 'Props list')

  const propsListSize = propsList.length

  return class RootBasedComponent extends React.PureComponent {
    functionAsChildComponent = ({ origin = '', rootPath = '' } = {}) => {
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
            subProps[subPropertyIndex] = getRootBasedUrl(
              origin,
              rootPath,
              propertyValue[subPropertyIndex]
            )
          }
          staticBasedProps[propertyName] = subProps
        } else {
          staticBasedProps[propertyName] = getRootBasedUrl(
            origin,
            rootPath,
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

export default connectRootBasedUrls
