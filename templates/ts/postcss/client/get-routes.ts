import App from './components/App'
import PostCSS from './components/PostCSS'

const routes = [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/',
        component: PostCSS,
        exact: true,
      },
    ],
  },
]

export const getRoutes = () => routes
