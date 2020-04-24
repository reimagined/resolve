import createAdapter from 'resolve-snapshot-base'
import sqlite from 'sqlite'
import tmp from 'tmp'
import os from 'os'
import fs from 'fs'

import connect from './connect'
import loadSnapshot from './load-snapshot'
import saveSnapshot from './save-snapshot'
import dropSnapshot from './drop-snapshot'
import init from './init'
import drop from './drop'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  {
    connect,
    loadSnapshot,
    saveSnapshot,
    dropSnapshot,
    init,
    drop,
    dispose
  },
  {
    sqlite,
    tmp,
    os,
    fs
  }
)
