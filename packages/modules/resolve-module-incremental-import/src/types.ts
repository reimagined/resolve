export type Request = {
  body: any
  headers: {
    [key:string]: string
  }
  resolve: {
    eventstoreAdapter: {
      freeze: () => Promise<void>
      unfreeze: () => Promise<void>
      beginIncrementalImport: () => Promise<string>
      pushIncrementalImport: (events: Array<object>, importId: string) => Promise<void>
      commitIncrementalImport: (importId: string) => Promise<void>
      rollbackIncrementalImport: () => Promise<void>
    }
  }
}

export type Response = {
  end: (content:string) => void,
  status: (code:number) => void,
}

export type WrappedRequest =  Request & {
  body: Array<object>
}
