import { App } from './containers/App'
import { Error } from './components/Error'
import { Login } from './components/Login'
import { UserById } from './containers/UserById'
import { NewestByPage } from './containers/NewestByPage'
import { ShowByPage } from './containers/ShowByPage'
import { AskByPage } from './containers/AskByPage'
import { StoryById } from './containers/StoryById'
import { Submit } from './containers/Submit'
import { CommentsByPage } from './containers/CommentsByPage'
import { CommentsTreeById } from './containers/CommentsTreeById'
import { PageNotFound } from './components/PageNotFound'
const routes = [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/error',
        component: Error,
      },
      {
        path: '/login',
        component: Login,
      },
      {
        path: '/user/:userId',
        component: UserById,
      },
      {
        path: '/',
        component: NewestByPage,
        exact: true,
      },
      {
        path: '/newest/:page?',
        component: NewestByPage,
      },
      {
        path: '/show/:page?',
        component: ShowByPage,
      },
      {
        path: '/ask/:page?',
        component: AskByPage,
      },
      {
        path: '/submit',
        component: Submit,
      },
      {
        path: '/storyDetails/:storyId/comments/:commentId',
        component: CommentsTreeById,
      },
      {
        path: '/storyDetails/:storyId',
        component: StoryById,
      },
      {
        path: '/comments/:page?',
        component: CommentsByPage,
      },
      {
        component: PageNotFound,
      },
    ],
  },
]
const getRoutes = () => routes
export { getRoutes }
