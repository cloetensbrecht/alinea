import {Entry, Outcome} from '@alinea/core'
import {ContentIndex} from '@alinea/index'
import fs from 'fs-extra'
import pLimit from 'p-limit'
import {Persistence} from '../Persistence'
import {fileChanges} from './FileChanges'

export class FSPersistence implements Persistence {
  constructor(protected index: ContentIndex, protected dir: string) {}

  async publish(entries: Array<Entry>) {
    const limit = pLimit(4)
    return Outcome.promised(async () => {
      const store = await this.index.store
      const {contentChanges, fileRemoves} = fileChanges(store, entries)
      const tasks = fileRemoves
        .map(file => {
          return limit(() => fs.unlink(file))
        })
        .concat(
          contentChanges.map(([file, contents]) => {
            return limit(() => fs.writeFile(file, contents))
          })
        )
      return Promise.all(tasks).then(() => void 0)
    })
  }
}
