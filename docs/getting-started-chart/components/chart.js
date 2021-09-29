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

import AggregatesPage from '../pages/_aggregates.mdx';
import ApiHandlersPage from '../pages/_api-handlers.mdx';
import EsAdapterPage from '../pages/_es-adapter.mdx';
import WriteSidePage from '../pages/_write-side.mdx';

import '../static/styles.css'

const tabs = {
  apiHandlers: {
    page: 'saddsfg dsf sdf',
  },
  writeSide: {
    page: 'saddsfg dsf sdf ',
  },
  aggregates: {
    page: 'saddsfg dsf sdf ',
  },
  esAdapter: {
    page: 'saddsfg dsf sdf ',
  },
}


const Chart = () => {
  const [selectedTab, setSelectedTab] = useState(null)

  const getSelected = (tabName) => tabName == selectedTab

  const renderDetail = () => {
    if (selectedTab == "writeSide") {
      return <div className="detail"><WriteSidePage></WriteSidePage></div>
    }
    if (selectedTab == "esAdapter") {
      return <div className="detail"><EsAdapterPage></EsAdapterPage></div>
    } 
    if (selectedTab == "apiHandlers") {
      return <div className="detail"><ApiHandlersPage></ApiHandlersPage></div>
    } 
    if (selectedTab == "aggregates") {
      return <div className="detail"><AggregatesPage></AggregatesPage></div>
    } 
    else {
      return null
    }
  }


  return (
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="true"
        height="400"
        width="550"
        viewBox="10 0 60 60"
      >
        <g transform="translate(-10.143 -142)">
          <Server />
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
          <ReadSide />
          <ReadModels />
          <Sagas />
          <ViewModels />

          <Client />
          <Arrows />
        </g>
      </svg>
      <div>
        {renderDetail()}
      </div>
    </div>
  )
}

export default Chart
