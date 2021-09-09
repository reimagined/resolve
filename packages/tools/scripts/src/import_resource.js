import crypto from 'crypto'
import fs from 'fs'

import {
  checkRuntimeEnv,
  injectRuntimeEnv as injectRuntimeEnvImpl,
} from './declare_runtime_env'
import resolveFile from './resolve_file'
import resolveFileOrModule from './resolve_file_or_module'

import {
  RUNTIME_ENV_ANYWHERE,
  RUNTIME_ENV_OPTIONS_ONLY,
  RUNTIME_ENV_NOWHERE,
  RESOURCE_CONSTRUCTOR_ONLY,
  RESOURCE_INSTANCE_ONLY,
  RESOURCE_ANY,
  IMPORT_CONSTRUCTOR,
  IMPORT_INSTANCE,
} from './constants'

const injectRuntimeEnv = (envKey, options) =>
  options != null
    ? injectRuntimeEnvImpl(envKey, options)
    : injectRuntimeEnvImpl(envKey)

const createHashCompileTime = (prefix, content) => {
  const hmac = crypto.createHmac('sha512', prefix)
  hmac.update(content)
  return hmac.digest('hex')
}

const createHashRunTime = (prefix, contentExpression) => `((content) => {
  const hmac = __non_webpack_require__('crypto')
    .createHmac('sha512', ${JSON.stringify(prefix)})
  hmac.update(content)
  return hmac.digest('hex')
})(${contentExpression})`

const importFileRuntime = (contentExpression) => `((moduleOrFile) => {
  return interopRequireDefault(__non_webpack_require__(moduleOrFile)).default
})(${contentExpression})`

const readImportedFileRuntime = (contentExpression) => `((moduleOrFile) => {
  const resolvedPath = __non_webpack_require__.resolve(moduleOrFile)
  return __non_webpack_require__('fs').readFileSync(resolvedPath).toString()
})(${contentExpression})`

const ensureInteropRequireDefault = (imports) => {
  const interopImport = [
    'import interopRequireDefault from ',
    `"@babel/runtime/helpers/interopRequireDefault"`,
  ].join('')

  if (imports.indexOf(interopImport) < 0) {
    imports.unshift(interopImport)
  }
}

const ensureFunctionBindings = (constants) => {
  const idempotentFunction = 'const idempotentFunction = value => value'
  const constructorBindFunction = `const constructorBindFunction =
    (
      constructorFunction,
      compileTimeOptions,
      compileTimeImports,
      runTimeOptions,
      runTimeImports
    ) => constructorFunction(
      { ...compileTimeOptions, ...runTimeOptions },
      { ...compileTimeImports, ...runTimeImports }
    )`

  if (constants.indexOf(idempotentFunction) < 0) {
    constants.unshift(idempotentFunction)
  }

  if (constants.indexOf(constructorBindFunction) < 0) {
    constants.unshift(constructorBindFunction)
  }
}

const isPrimitiveType = (value) =>
  value == null ||
  value.constructor === Number ||
  value.constructor === String ||
  value.constructor === Boolean ||
  Array.isArray(value) ||
  value.constructor === Object

const throwInternalError = (message) => {
  throw new Error(`Internal error: ${message}`)
}

const validateRuntimeMode = (runtimeMode) => {
  if (
    runtimeMode !== RUNTIME_ENV_ANYWHERE &&
    runtimeMode !== RUNTIME_ENV_OPTIONS_ONLY &&
    runtimeMode !== RUNTIME_ENV_NOWHERE
  ) {
    throwInternalError(`wrong runtime mode ${runtimeMode}`)
  }
}

const validateImportMode = (importMode) => {
  if (
    importMode !== RESOURCE_CONSTRUCTOR_ONLY &&
    importMode !== RESOURCE_INSTANCE_ONLY &&
    importMode !== RESOURCE_ANY
  ) {
    throwInternalError(`wrong import mode ${importMode}`)
  }
}

const validateInstanceMode = (instanceMode) => {
  if (instanceMode !== IMPORT_CONSTRUCTOR && instanceMode !== IMPORT_INSTANCE) {
    throwInternalError(`wrong instance mode ${instanceMode}`)
  }
}

const importEmptyResource = ({
  imports,
  constants,
  resourceName,
  importMode = RESOURCE_ANY,
  instanceMode = IMPORT_INSTANCE,
  instanceFallback = null,
}) => {
  if (importMode === RESOURCE_CONSTRUCTOR_ONLY || instanceFallback == null) {
    throwInternalError(
      `resource ${resourceName} is not specified and have no fallback`
    )
  }

  const resourceFile = resolveFile(null, instanceFallback)
  imports.push(
    `import ${resourceName}_instance from ${JSON.stringify(resourceFile)}`
  )

  if (instanceMode === IMPORT_CONSTRUCTOR) {
    constants.push(
      `const ${resourceName} = idempotentFunction.bind(null, ${resourceName}_instance)`
    )
  } else {
    constants.push(`const ${resourceName} = ${resourceName}_instance`)
  }
}

const validateInstanceResource = ({
  resourceName,
  resourceValue,
  importMode,
  runtimeMode,
}) => {
  if (importMode === RESOURCE_CONSTRUCTOR_ONLY) {
    throwInternalError(
      `resource ${resourceName} must be constructor, not instance`
    )
  }

  if (checkRuntimeEnv(resourceValue) && runtimeMode !== RUNTIME_ENV_ANYWHERE) {
    throwInternalError(
      `resource ${resourceName} cannot have runtime variable injections`
    )
  }
}

const importInstanceResource = ({
  imports,
  constants,
  resourceName,
  resourceValue,
  runtimeMode = RUNTIME_ENV_NOWHERE,
  importMode = RESOURCE_ANY,
  instanceMode = IMPORT_INSTANCE,
  instanceFallback = null,
  calculateHash = null,
  injectRuntimeOptions = null,
  indexEntry = null,
}) => {
  validateInstanceResource({
    resourceName,
    resourceValue,
    importMode,
    runtimeMode,
  })

  if (!checkRuntimeEnv(resourceValue)) {
    const resourceFile = resolveFile(resourceValue, instanceFallback)
    if (indexEntry == null) {
      imports.push(
        `import ${resourceName}_instance from ${JSON.stringify(resourceFile)}`
      )
    } else {
      imports.push(
        `import { ${indexEntry} as ${resourceName}_instance } from ${JSON.stringify(
          resourceFile
        )}`
      )
    }

    if (calculateHash != null) {
      constants.push(
        `const ${resourceName}_hash = ${JSON.stringify(
          createHashCompileTime(
            calculateHash,
            fs.readFileSync(resourceFile).toString()
          )
        )}`
      )
    }
  } else {
    ensureInteropRequireDefault(imports)
    constants.push(
      `const ${resourceName}_instance = ${importFileRuntime(
        injectRuntimeEnv(resourceValue, injectRuntimeOptions)
      )}`
    )

    if (calculateHash != null) {
      constants.push(
        `const ${resourceName}_hash = ${createHashRunTime(
          calculateHash,
          readImportedFileRuntime(
            injectRuntimeEnv(resourceValue, injectRuntimeOptions)
          )
        )}`
      )
    }
  }

  if (instanceMode === IMPORT_CONSTRUCTOR) {
    constants.push(
      `const ${resourceName} = idempotentFunction.bind(null, ${resourceName}_instance)`
    )
  } else {
    constants.push(`const ${resourceName} = ${resourceName}_instance`)
  }
}

const validateConstructorResourceImports = ({
  resourceName,
  resourceValue,
  runtimeMode,
}) => {
  let imports = resourceValue.imports
  if (imports != null && imports.constructor !== Object) {
    throwInternalError(`resource ${resourceName}.imports must be an object`)
  }

  imports = imports != null ? imports : {}

  for (const importKey of Object.keys(imports)) {
    const importValue = imports[importKey]

    if (importValue == null || importValue.constructor !== String) {
      throwInternalError(
        `resource ${resourceName}.imports.${importKey} must be a string`
      )
    }

    if (checkRuntimeEnv(importValue) && runtimeMode !== RUNTIME_ENV_ANYWHERE) {
      throwInternalError(
        `resource ${resourceName}.imports.${importKey} cannot have runtime variable injections`
      )
    }
  }
}

const validateConstructorResourceOptions = ({
  resourceName,
  resourceValue,
  runtimeMode,
}) => {
  let options = resourceValue.options
  if (options != null && options.constructor !== Object) {
    throwInternalError(`resource ${resourceName}.options must be an object`)
  }

  options = options != null ? options : {}

  void JSON.stringify(options, (key, value) => {
    if (!isPrimitiveType(value)) {
      throwInternalError(
        `resource ${resourceName}.options.[...].${key} must be a primitive type`
      )
    }

    if (checkRuntimeEnv(value) && runtimeMode === RUNTIME_ENV_NOWHERE) {
      throwInternalError(
        `resource ${resourceName}.options.[...].${key} cannot have runtime variable injections`
      )
    }

    return value
  })
}

const validateConstructorResource = ({
  resourceName,
  resourceValue,
  importMode,
  runtimeMode,
}) => {
  if (importMode === RESOURCE_INSTANCE_ONLY) {
    throwInternalError(
      `resource ${resourceName} must be an instance, not constructor`
    )
  }

  const module = resourceValue.module
  if (module == null || module.constructor !== String) {
    throwInternalError(`resource ${resourceName}.module must be a string`)
  }

  if (checkRuntimeEnv(module) && runtimeMode !== RUNTIME_ENV_ANYWHERE) {
    throwInternalError(
      `resource ${resourceName}.module cannot have runtime variable injections`
    )
  }

  validateConstructorResourceImports({
    resourceName,
    resourceValue,
    runtimeMode,
  })

  validateConstructorResourceOptions({
    resourceName,
    resourceValue,
    runtimeMode,
  })
}

const importConstructorResourceModule = ({
  resourceName,
  resourceValue,
  imports,
  constants,
  calculateHash,
  injectRuntimeOptions,
}) => {
  const module = resourceValue.module
  if (!checkRuntimeEnv(module)) {
    imports.push(
      `import ${resourceName}_constructor from ${JSON.stringify(
        resolveFileOrModule(module)
      )}`
    )

    if (calculateHash != null) {
      constants.push(
        `const ${resourceName}_constructor_hash = ${JSON.stringify(
          createHashCompileTime(
            calculateHash,
            fs.readFileSync(resolveFileOrModule(module, true)).toString()
          )
        )}`
      )
    }
  } else {
    ensureInteropRequireDefault(imports)
    constants.push(
      `const ${resourceName}_constructor = ${importFileRuntime(
        injectRuntimeEnv(module, injectRuntimeOptions)
      )}`
    )

    if (calculateHash != null) {
      constants.push(
        `const ${resourceName}_constructor_hash = ${createHashRunTime(
          calculateHash,
          readImportedFileRuntime(
            injectRuntimeEnv(module, injectRuntimeOptions)
          )
        )}`
      )
    }
  }
}

const importConstructorResourceImports = ({
  resourceName,
  resourceValue,
  imports,
  constants,
  calculateHash,
  injectRuntimeOptions,
}) => {
  const resourceImports =
    resourceValue.imports != null ? resourceValue.imports : {}
  const inlinedImports = []

  for (const importKey of Object.keys(resourceImports)) {
    const importValue = resourceImports[importKey]

    const inlineImportKey = `${resourceName}_import_${importKey}`
    const resourceFile = resolveFile(importValue)

    if (!checkRuntimeEnv(importValue)) {
      imports.push(
        `import ${inlineImportKey} from ${JSON.stringify(resourceFile)}`
      )

      if (calculateHash != null) {
        constants.push(
          `const ${inlineImportKey}_hash = ${JSON.stringify(
            createHashCompileTime(
              calculateHash,
              fs
                .readFileSync(resolveFileOrModule(resourceFile, true))
                .toString()
            )
          )}`
        )
      }
    } else {
      ensureInteropRequireDefault(imports)
      constants.push(
        `const ${inlineImportKey} = ${importFileRuntime(
          injectRuntimeEnv(importValue, injectRuntimeOptions)
        )})`
      )

      if (calculateHash != null) {
        constants.push(
          `const ${inlineImportKey}_hash = ${createHashRunTime(
            calculateHash,
            readImportedFileRuntime(
              injectRuntimeEnv(importValue, injectRuntimeOptions)
            )
          )}`
        )
      }
    }

    inlinedImports.push({ importKey, inlineImportKey })
  }

  constants.push(
    `const ${resourceName}_imports = { ${inlinedImports
      .map(
        ({ importKey, inlineImportKey }) =>
          `[${JSON.stringify(importKey)}]: ${inlineImportKey}`
      )
      .join(',')} }`
  )

  if (calculateHash != null) {
    constants.push(
      `const ${resourceName}_imports_hash = ${createHashRunTime(
        calculateHash,
        `JSON.stringify([${inlinedImports
          .map(({ inlineImportKey }) => `${inlineImportKey}_hash`)
          .join(',')}
        ])`
      )}`
    )
  }
}

const importConstructorResourceOptions = ({
  resourceName,
  resourceValue,
  constants,
  calculateHash,
  injectRuntimeOptions,
}) => {
  const options = resourceValue.options != null ? resourceValue.options : {}

  constants.push(
    `const ${resourceName}_options = ${injectRuntimeEnv(
      options,
      injectRuntimeOptions
    )}`
  )

  if (calculateHash != null) {
    constants.push(
      `const ${resourceName}_options_hash = ${createHashRunTime(
        calculateHash,
        `JSON.stringify(${resourceName}_options)`
      )}`
    )
  }
}

const importConstructorResource = ({
  imports,
  constants,
  resourceName,
  resourceValue,
  runtimeMode = RUNTIME_ENV_NOWHERE,
  importMode = RESOURCE_ANY,
  instanceMode = IMPORT_INSTANCE,
  calculateHash = null,
  injectRuntimeOptions,
}) => {
  validateConstructorResource({
    resourceName,
    resourceValue,
    importMode,
    runtimeMode,
  })

  importConstructorResourceModule({
    resourceName,
    resourceValue,
    imports,
    constants,
    calculateHash,
    injectRuntimeOptions,
  })

  importConstructorResourceImports({
    resourceName,
    resourceValue,
    imports,
    constants,
    calculateHash,
    injectRuntimeOptions,
  })

  importConstructorResourceOptions({
    resourceName,
    resourceValue,
    imports,
    constants,
    calculateHash,
    injectRuntimeOptions,
  })

  constants.push()

  if (instanceMode === IMPORT_CONSTRUCTOR) {
    constants.push(`const ${resourceName} = constructorBindFunction.bind(null,
      ${resourceName}_constructor,
      ${resourceName}_options,
      ${resourceName}_imports
    )
    Object.assign(${resourceName}, ${resourceName}_constructor)
    `)
  } else {
    constants.push(`const ${resourceName} = ${resourceName}_constructor(
      ${resourceName}_options,
      ${resourceName}_imports
    )`)
  }

  if (calculateHash != null) {
    constants.push(
      `const ${resourceName}_hash = ${createHashRunTime(
        calculateHash,
        `JSON.stringify([
          ${resourceName}_constructor_hash,
          ${resourceName}_options_hash,
          ${resourceName}_imports_hash
        ])`
      )}`
    )
  }
}

const importResource = (options) => {
  const { runtimeMode, importMode, instanceMode, resourceValue } = options
  validateRuntimeMode(runtimeMode)
  validateImportMode(importMode)
  validateInstanceMode(instanceMode)
  ensureFunctionBindings(options.constants)

  if (resourceValue == null) {
    return importEmptyResource(options)
  } else if (resourceValue.constructor === String) {
    return importInstanceResource(options)
  } else if (resourceValue.constructor === Object) {
    return importConstructorResource(options)
  } else {
    throwInternalError(
      `import resource ${resourceValue} is not supported due unknown type`
    )
  }
}

export default importResource
