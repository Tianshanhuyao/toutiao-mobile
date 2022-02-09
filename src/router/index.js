import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'
import { Dialog } from 'vant'

const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location, onResolve, onReject) {
  // VueRouter 没有对错误进行捕获，这个代码的意思就是捕获一下
  if (onResolve || onReject) {
    return originalPush.call(this, location, onResolve, onReject)
  }
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    // name: 'layout', // 拥有默认子路由时，此 name 没有意义
    component: () => import('@/views/layout'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '', // 默认子路由，只能有一个
        name: 'home',
        component: () => import('@/views/home'),
        meta: { requiresAuth: false }
      },
      {
        path: '/qa',
        name: 'qa',
        component: () => import('@/views/qa'),
        meta: { requiresAuth: true }
      },
      {
        path: '/video',
        name: 'video',
        component: () => import('@/views/video'),
        meta: { requiresAuth: true }
      },
      {
        path: '/my',
        name: 'my',
        component: () => import('@/views/my'),
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/search'),
    meta: { requiresAuth: false }
  },
  {
    path: '/article/:articleId',
    name: 'article',
    component: () => import('@/views/article'),
    props: true, // 开启 props 传参，把路由参数映射到组件的 props 数据中
    meta: { requiresAuth: false }
  },
  {
    path: '/user/profile',
    name: 'user-profile',
    component: () => import('@/views/user-profile'),
    meta: { requiresAuth: false }
  }
]

const router = new VueRouter({
  routes
})
router.beforeEach((to, from, next) => {
  // 先看一下当前路由需要登录才能访问吗
  if (to.meta.requiresAuth) {
    // 再看一下用户登录了吗
    const { user } = store.state
    // 如果说用户登陆了，直接放行
    if (user) return next()
    // 如果说用户没有登陆，弹框问一下是否需要登录，需要就跳转到登录页，不需要就卡在当前页
    Dialog.confirm({
      title: '提示',
      message: '需要登陆吗'
    })
      .then(() => {
        // on confirm
        next('/login')
      })
      .catch(() => {
        // on cancel
        next(false)
      })
  } else {
    // 如果不需要，直接放行
    next()
  }
})

export default router
