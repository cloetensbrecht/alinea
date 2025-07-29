//import {EntryProperty} from '../draft/EntryProperty.js'
//import {useCurrentDraft} from '../hook/UseCurrentDraft.js'
import styler from '@alinea/styler'
import {track} from 'alinea/config'
import {Entry} from 'alinea/core/Entry'
import type {EntryFields} from 'alinea/core/EntryFields'
import type {Filter} from 'alinea/core/Filter'
import type {Order, QueryWithResult} from 'alinea/core/Graph'
import type {RootData} from 'alinea/core/Root'
import {type} from 'alinea/core/Type'
import {workspaceMediaDir} from 'alinea/core/util/EntryFilenames'
import {useForm} from 'alinea/dashboard'
import {EntryHeader} from 'alinea/dashboard/view/entry/EntryHeader'
import {select} from 'alinea/field'
import {HStack, TextLabel, VStack} from 'alinea/ui'
import {IcRoundArrowBack} from 'alinea/ui/icons/IcRoundArrowBack'
import {Main} from 'alinea/ui/Main'
import {type Dispatch, type SetStateAction, useMemo, useState} from 'react'
import {useQuery} from 'react-query'
import type {EntryEditor} from '../atoms/EntryEditorAtoms.js'
import {useNavigate} from '../atoms/LocationAtoms.js'
import {InputForm} from '../editor/InputForm.js'
import {useConfig} from '../hook/UseConfig.js'
import {useGraph} from '../hook/UseGraph.js'
import {useNav} from '../hook/UseNav.js'
import {useRoot} from '../hook/UseRoot.js'
import {useWorkspace} from '../hook/UseWorkspace.js'
import {Head} from '../util/Head.js'
import {Explorer, type ExporerItemSelect} from './explorer/Explorer.js'
import {IconLink} from './IconButton.js'
import css from './MediaExplorer.module.scss'
import {FileUploader} from './media/FileUploader.js'

const styles = styler(css)

export interface MediaExplorerProps {
  editor?: EntryEditor
  root?: RootData
}

const sortOptions = {
  id: 'Latest',
  titleAsc: 'Title A-Z',
  titleDesc: 'Title Z-A'
}
type SortOptions = keyof typeof sortOptions

function FilterAndSortBar({
  setSortBy
}: {
  setSortBy: Dispatch<SetStateAction<SortOptions>>
}) {
  const insertSortField = useMemo(() => {
    const sortField = select('Sort by', {
      options: sortOptions,
      initialValue: 'id',
      required: true,
      width: 0.25
    })
    return track.options(sortField, get => {
      const selectedSort = get(sortField)
      setSortBy(selectedSort)
      return {}
    })
  }, [])

  const filterAndSortForm = useMemo(
    () =>
      type('', {
        fields: {
          sort: insertSortField
        }
      }),
    []
  )
  const form = useForm(filterAndSortForm)

  return (
    <HStack className={styles.root.filterAndSortBar()}>
      <div style={{width: '100%'}}>
        <InputForm border={false} form={form} />
      </div>
    </HStack>
  )
}

export function MediaExplorer({editor}: MediaExplorerProps) {
  const config = useConfig()
  const parentId = editor?.entryId
  const workspace = useWorkspace()
  const root = useRoot()
  const graph = useGraph()
  const [sortBy, setSortBy] = useState<SortOptions>('id')
  const condition = useMemo((): Filter<EntryFields> => {
    return {
      _root: root.name,
      _workspace: workspace.name,
      _parentId: parentId ?? null
    }
  }, [workspace, root, parentId])

  const {data} = useQuery(
    ['explorer', 'media', 'total', condition, sortBy],
    async () => {
      const orderBy: Order[] = [{desc: Entry.type}]
      if (sortBy === 'id') {
        orderBy.push({desc: Entry.id})
      } else if (sortBy === 'titleAsc') {
        orderBy.push({asc: Entry.title})
      } else if (sortBy === 'titleDesc') {
        orderBy.push({desc: Entry.title})
      }

      const query: QueryWithResult<ExporerItemSelect> = {
        select: undefined!,
        orderBy,
        filter: condition
      }
      const info =
        parentId &&
        (await graph.first({
          select: {
            title: Entry.title,
            parent: Entry.parentId
          },
          id: parentId,
          status: 'preferDraft'
        }))
      return {...info, query}
    },
    {suspense: true, keepPreviousData: true}
  )
  const {query} = data!
  const title = data?.title || root.label
  const nav = useNav()
  const navigate = useNavigate()
  const backLink = data?.parent
    ? nav.entry({id: data.parent})
    : editor
      ? nav.root({root: root.name})
      : undefined
  return (
    <Main className={styles.root()} scrollable={false}>
      {editor && <EntryHeader editable={false} editor={editor} />}
      <div className={styles.root.inner()}>
        <HStack style={{flexGrow: 1, minHeight: 0}}>
          <VStack style={{height: '100%', width: '100%'}}>
            <header className={styles.root.inner.header()}>
              <Head>
                <title>{`${workspace.label}: ${String(title)}`}</title>
              </Head>
              <VStack gap={18}>
                <HStack center gap={18}>
                  {backLink && (
                    <IconLink icon={IcRoundArrowBack} href={backLink} />
                  )}
                  <h1 className={styles.root.title()}>
                    <TextLabel label={title} />
                  </h1>
                </HStack>
                <FilterAndSortBar setSortBy={setSortBy} />
              </VStack>
            </header>
            <Explorer
              query={query}
              type="thumb"
              virtualized
              onNavigate={id => navigate(nav.entry({id: id}))}
            />
          </VStack>
        </HStack>
        <FileUploader
          destination={{
            parentId,
            workspace: workspace.name,
            root: root.name,
            directory: workspaceMediaDir(config, workspace.name)
          }}
        />
      </div>
    </Main>
  )
}
