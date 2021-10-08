import {Entry, Outcome} from '@alinea/core'
import {ContentIndex} from '@alinea/index'
import {Octokit} from '@octokit/rest'
import createOrUpdateFiles from 'octokit-commit-multiple-files/create-or-update-files'
import path from 'path/posix'
import {Persistence} from '../Persistence'
import {fileChanges} from './FileChanges'

export type GithubPersistenceOptions = {
  index: ContentIndex
  contentDir: string
  githubAuthToken: string
  owner: string
  repo: string
  branch: string
}

export class GithubPersistence implements Persistence {
  octokit: Octokit

  constructor(protected options: GithubPersistenceOptions) {
    this.octokit = new Octokit({auth: options.githubAuthToken})
  }

  async publish(entries: Array<Entry>) {
    return Outcome.promised(async () => {
      const store = await this.options.index.store
      const {contentChanges, fileRemoves} = fileChanges(store, entries)
      return createOrUpdateFiles(this.octokit, {
        owner: this.options.owner,
        repo: this.options.repo,
        branch: this.options.branch,
        changes: [
          {
            message: 'Update content',
            files: Object.fromEntries(
              contentChanges.map(([file, contents]) => [
                path.join(this.options.contentDir, file),
                contents
              ])
            ),
            filesToDelete: fileRemoves.map(file =>
              path.join(this.options.contentDir, file)
            )
          }
        ]
      })
    })
  }
}
