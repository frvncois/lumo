import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { api } from '../utils/api'

// Extend route meta
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresOwner?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/admin/setup',
    name: 'Setup',
    component: () => import('../views/Setup.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/admin/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/admin',
    component: () => import('../components/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: 'pages/:id',
        name: 'PageEditor',
        component: () => import('../views/PageEditor.vue'),
      },
      {
        path: 'posts/:type',
        name: 'PostList',
        component: () => import('../views/PostList.vue'),
      },
      {
        path: 'posts/:type/:id',
        name: 'PostEditor',
        component: () => import('../views/PostEditor.vue'),
      },
      {
        path: 'media',
        name: 'MediaLibrary',
        component: () => import('../views/MediaLibrary.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { requiresOwner: true },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Auth guard
router.beforeEach(async (to) => {
  try {
    const status = await api.getAuthStatus()

    // If setup needed, only allow setup page
    if (status.needsSetup) {
      if (to.path !== '/admin/setup') {
        return '/admin/setup'
      }
      return true
    }

    // If setup done but on setup page, redirect to login
    if (to.path === '/admin/setup') {
      return '/admin/login'
    }

    // Normal auth check for protected routes
    if (to.meta.requiresAuth) {
      try {
        const user = await api.getMe()

        // Check for owner-only routes
        if (to.meta.requiresOwner && user.role !== 'owner') {
          return '/admin' // Redirect to dashboard if not owner
        }

        return true
      } catch (error) {
        return '/admin/login'
      }
    }

    return true
  } catch (error) {
    // If auth status check fails, allow navigation to continue
    return true
  }
})

export default router
