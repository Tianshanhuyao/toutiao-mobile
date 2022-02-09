import axios from 'axios'
import store from '@/store'
import JSONbig from 'json-bigint'
import { Toast } from 'vant'
import router from '@/router'

const request = axios.create({
  // baseURL: 'http://ttapi.research.itcast.cn/', // 接口的基准路径
  transformResponse: [
    function(data) {
      try {
        return JSONbig.parse(data)
      } catch (err) {
        // 非 JSON 格式的字符串，直接返回即可
        return data
      }
    }
  ]
})

const requestToken = axios.create()

// 请求拦截器
request.interceptors.request.use(
  config => {
    const { user } = store.state
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`
    }
    return config
  },
  error => {
    // 如果请求出错了（还没发出去）
    return Promise.reject(error)
  }
)

const login = () => {
  // router.currentRoute => this.$route
  // console.log(router.currentRoute.fullPath)
  router.replace({
    name: 'login',
    query: {
      redirect: router.currentRoute.fullPath
    }
  })
}

// 响应拦截器进行统一错误处理
request.interceptors.response.use(
  data => {
    return data
  },
  async err => {
    // console.dir(err)
    const status = err.response.status
    if (status === 400) {
      Toast.fail('请求参数错误')
    } else if (status === 401) {
      // !#1 如果说 Vuex 里面没有 user 或者说 user 下面没有 refresh_token，直接让用户登录
      const { user } = store.state
      if (!user || !user.refresh_token) {
        login()
      } else {
        // !#2 用 user.refresh_token 换取 TOKEN
        // 有可能用 request 发请求的时候又出现了 401，那么就会到响应拦截器 401 这一步，又调用了 request 发请求 ... 死循环
        try {
          const {
            data: {
              data: { token }
            }
          } = await requestToken({
            url: '/app/v1_0/authorizations',
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${user.refresh_token}`
            }
          })
          // console.log(token)
          // !#3 用换取过来的新 TOKEN 更新到本地和 Vuex
          user.token = token
          store.commit('setUser', user)
          // !#4 把之前的请求再重新发一遍
          console.log(err.config)
          // 这里 err.config 带过去的确实的过期的 TOKEN，但是你别忘了
          // request 发请求肯定会经过请求拦截器，请求拦截器会从新去 Vuex 里面获取 token
          // 而这一获取的 token 就是上面你所设置的新 TOKEN
          return request(err.config)
        } catch (error) {
          // 14 天以后，你用了一个过期的 refresh_token 换取 token
          // 肯定会走 catch，需要重新登录
          // router.replace('/login')
          login()
          err = error
        }
      }
      Toast.fail('TOKEN 无效')
    } else if (status === 403) {
      Toast.fail('没有权限')
    } else if (status === 404) {
      Toast.fail('资源不存在')
    } else if (status === 405) {
      Toast.fail('请求方式不正确')
    } else if (status >= 500) {
      Toast.fail('服务器错误')
    }
    return Promise.reject(err)
  }
)

export default request
