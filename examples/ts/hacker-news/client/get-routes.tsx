import type { RouteObject } from 'react-router'
import React from 'react'

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

const routes: Array<RouteObject> = [
  { path: '/', element: <NewestByPage />, index: true },
  { path: '/newest', element: <NewestByPage /> },
  { path: '/error', element: <Error /> },
  { path: '/login', element: <Login /> },
  { path: '/user/:userId', element: <UserById /> },
  { path: '/newest/:page', element: <NewestByPage /> },
  { path: '/newest', element: <NewestByPage /> },
  { path: '/show/:page', element: <ShowByPage /> },
  { path: '/show', element: <ShowByPage /> },
  { path: '/ask/:page', element: <AskByPage /> },
  { path: '/ask', element: <AskByPage /> },
  { path: '/submit', element: <Submit /> },
  {
    path: '/storyDetails/:storyId/comments/:commentId',
    element: <CommentsTreeById />,
  },
  { path: '/storyDetails/:storyId', element: <StoryById /> },
  { path: '/comments/:page', element: <CommentsByPage /> },
  { path: '/comments', element: <CommentsByPage /> },
  { path: '*', element: <PageNotFound /> },
]

const getRoutes = () => routes

export { getRoutes }
