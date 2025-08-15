export interface UserInfo {
  id: number | string
  shopAccount: {
    avatar: string
    username: string
    nickname: string
    role: string
  }
}

export function getUserInfoApi() {
  return useGet<UserInfo>('/shopAccount/info')
}
