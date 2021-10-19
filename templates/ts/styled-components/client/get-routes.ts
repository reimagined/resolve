import App from './components/App'
import StyledComponents from './components/StyledComponents'

const routes = [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/',
        component: StyledComponents,
        exact: true,
      },
    ],
  },
]

export const getRoutes = () => routes
