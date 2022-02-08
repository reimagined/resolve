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

const getPartial = (tab) => {
  switch (tab) {
    case 'aggregates':
      return <AggregatesPage></AggregatesPage>
    case 'apiHandlers':
      return <ApiHandlersPage></ApiHandlersPage>
    case 'client':
      return <ClientPage></ClientPage>
    case 'esAdapter':
      return <EsAdapterPage></EsAdapterPage>
    case 'readModels':
      return <ReadModelsPage></ReadModelsPage>
    case 'readSide':
      return <ReadSidePage></ReadSidePage>
    case 'sagas':
      return <SagasPage></SagasPage>
    case 'server':
      return <ServerPage></ServerPage>
    case 'viewModels':
      return <ViewModelsPage></ViewModelsPage>
    case 'writeSide':
      return <WriteSidePage></WriteSidePage>
  }
}

const renderDetail = (tab) => (
  <div className="alert alert--info">{getPartial(tab)}</div>
)

const Chart = ({ selected, onClick }) => {
  const [selectedTab, setSelectedTab] = useState(null)

  const getSelected = (tabName) => tabName == selectedTab

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
      <div>{renderDetail(selectedTab)}</div>
    </div>
  )
}

export default Chart
