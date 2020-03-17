export interface JSONWebTokenProvider {
  get(): Promise<string>
  set(jwt: string): Promise<void>
}
