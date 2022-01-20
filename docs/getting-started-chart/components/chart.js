import React, { useState } from 'react'

import Adapter from './Adapter'
import Aggregates from './Aggregates'
import ApiHandlers from './ApiHandlers'
import Arrows from './Arrows'
import Client from './Client'
import DataBase from './DataBase'
import ReadModels from './ReadModels'
import ReadSide from './ReadSide'
import Sagas from './Sagas'
import Server from './Server'
import ViewModels from './ViewModels'
import WriteSide from './WriteSide'

import AggregatesPage from '../pages/_aggregates.mdx'
import ApiHandlersPage from '../pages/_api-handlers.mdx'
import ClientPage from '../pages/_client.mdx'
import EsAdapterPage from '../pages/_es-adapter.mdx'
import ReadModelsPage from '../pages/_read-models.mdx'
import ReadSidePage from '../pages/_read-side.mdx'
import SagasPage from '../pages/_sagas.mdx'
import ServerPage from '../pages/_server.mdx'
import ViewModelsPage from '../pages/_view-models.mdx'
import WriteSidePage from '../pages/_write-side.mdx'

import '../static/styles.css'

const Chart = ({ selected, onClick }) => {
  const [selectedTab, setSelectedTab] = useState(null)

  const getSelected = (tabName) => tabName == selectedTab

  const renderDetail = () => {
    if (selectedTab == 'aggregates') {
      return (
        <div className="alert alert--info">
          <AggregatesPage></AggregatesPage>
        </div>
      )
    } else if (selectedTab == 'apiHandlers') {
      return (
        <div className="alert alert--info">
          <ApiHandlersPage></ApiHandlersPage>
        </div>
      )
    } else if (selectedTab == 'client') {
      return (
        <div className="alert alert--info">
          <ClientPage></ClientPage>
        </div>
      )
    } else if (selectedTab == 'esAdapter') {
      return (
        <div className="alert alert--info">
          <EsAdapterPage></EsAdapterPage>
        </div>
      )
    } else if (selectedTab == 'readModels') {
      return (
        <div className="alert alert--info">
          <ReadModelsPage></ReadModelsPage>
        </div>
      )
    } else if (selectedTab == 'readSide') {
      return (
        <div className="alert alert--info">
          <ReadSidePage></ReadSidePage>
        </div>
      )
    } else if (selectedTab == 'sagas') {
      return (
        <div className="alert alert--info">
          <SagasPage></SagasPage>
        </div>
      )
    } else if (selectedTab == 'server') {
      return (
        <div className="alert alert--info">
          <ServerPage></ServerPage>
        </div>
      )
    } else if (selectedTab == 'viewModels') {
      return (
        <div className="alert alert--info">
          <ViewModelsPage></ViewModelsPage>
        </div>
      )
    } else if (selectedTab == 'writeSide') {
      return (
        <div className="alert alert--info">
          <WriteSidePage></WriteSidePage>
        </div>
      )
    } else return null
  }
  return (
    <div>
      <svg
        width="550"
        height="445"
        viewBox="0 0 550 445"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <Server
            selected={getSelected('server')}
            onClick={() => setSelectedTab('server')}
          />
          <WriteSide
            selected={getSelected('writeSide')}
            onClick={() => setSelectedTab('writeSide')}
          />
          <Aggregates
            selected={getSelected('aggregates')}
            onClick={() => setSelectedTab('aggregates')}
          />
          <DataBase />
          <ApiHandlers
            selected={getSelected('apiHandlers')}
            onClick={() => setSelectedTab('apiHandlers')}
          />
          <Adapter
            selected={getSelected('esAdapter')}
            onClick={() => setSelectedTab('esAdapter')}
          />
          <ReadSide
            selected={getSelected('readSide')}
            onClick={() => setSelectedTab('readSide')}
          />
          <ReadModels
            selected={getSelected('readModels')}
            onClick={() => setSelectedTab('readModels')}
          />
          <Sagas
            selected={getSelected('sagas')}
            onClick={() => setSelectedTab('sagas')}
          />
          <ViewModels
            selected={getSelected('viewModels')}
            onClick={() => setSelectedTab('viewModels')}
          />

          <Client
            selected={getSelected('client')}
            onClick={() => setSelectedTab('client')}
          />
          <Arrows />
        </g>
      </svg>
      <div>{renderDetail()}</div>
    </div>
  )
}

export default Chart
