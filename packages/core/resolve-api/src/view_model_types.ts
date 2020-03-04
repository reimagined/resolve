export interface ViewModel {
  name: string
  projection: Array<object>
  deserializeState: (state: string) => object
}
