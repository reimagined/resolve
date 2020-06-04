export type ViewModelInitialize = () => any
export type ViewModelReducer = (state: any, event: object) => any
export type ViewModel = {
  name: string
  projection: {
    Init: ViewModelInitialize
    [key: string]: ViewModelReducer
  }
  deserializeState: (state: string) => object
}
