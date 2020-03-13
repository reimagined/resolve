export type ViewModelReducer = (state: any, event: object) => any
export type ViewModel = {
  name: string
  projection: { [key: string]: ViewModelReducer }
  deserializeState: (state: string) => object
}
