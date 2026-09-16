import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/axios/http', () => ({
  http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import { apiRoutes } from '@/api-routes'
import { http } from '@/axios/http'
import {
  collectionApi,
  commonTaskApi,
  dailyTaskApi,
  eventApi,
  feedbackApi,
  projectApi,
  sectionApi,
  tagApi,
  taskApi,
  userApi,
} from '@/api'

type Verb = 'get' | 'post' | 'patch' | 'delete'

interface Row {
  label: string
  route: keyof typeof apiRoutes
  verb: Verb
  run: () => void
  args: unknown[]
}

const event = {
  name: 'Réunion',
  description: null,
  startDate: '2026-03-10',
  startTime: null,
  endDate: null,
  endTime: null,
  takesWholeDay: false,
}

const parameterisedRoutes: Row[] = [
  {
    label: 'projectApi.getProjectById',
    route: 'projectById',
    verb: 'get',
    run: () => projectApi.getProjectById(7),
    args: ['project/7/'],
  },
  {
    label: 'projectApi.updateProject',
    route: 'projectById',
    verb: 'patch',
    run: () => projectApi.updateProject(7, { name: 'X' }),
    args: ['project/7/', { name: 'X' }],
  },
  {
    label: 'projectApi.deleteProject',
    route: 'projectById',
    verb: 'delete',
    run: () => projectApi.deleteProject(7),
    args: ['project/7/'],
  },
  {
    label: 'collectionApi.getCollectionById',
    route: 'collectionById',
    verb: 'get',
    run: () => collectionApi.getCollectionById(7),
    args: ['collection/7/'],
  },
  {
    label: 'collectionApi.updateCollection',
    route: 'collectionById',
    verb: 'patch',
    run: () => collectionApi.updateCollection(7, { name: 'X' }),
    args: ['collection/7/', { name: 'X' }],
  },
  {
    label: 'collectionApi.deleteCollection',
    route: 'collectionById',
    verb: 'delete',
    run: () => collectionApi.deleteCollection(7),
    args: ['collection/7/'],
  },
  {
    label: 'sectionApi.updateSection',
    route: 'sectionById',
    verb: 'patch',
    run: () => sectionApi.updateSection(7, { name: 'X' }),
    args: ['section/7/', { name: 'X' }],
  },
  {
    label: 'sectionApi.deleteSection',
    route: 'sectionById',
    verb: 'delete',
    run: () => sectionApi.deleteSection(7),
    args: ['section/7/'],
  },
  {
    label: 'taskApi.updateTaskById',
    route: 'taskById',
    verb: 'patch',
    run: () => taskApi.updateTaskById(7, { completed: true }),
    args: ['task/7/', { completed: true }],
  },
  {
    label: 'taskApi.deleteTaskById',
    route: 'taskById',
    verb: 'delete',
    run: () => taskApi.deleteTaskById(7),
    args: ['task/7/'],
  },
  {
    label: 'eventApi.updateEventById',
    route: 'eventById',
    verb: 'patch',
    run: () => eventApi.updateEventById(7, event, { extended: false }),
    args: ['event/7/', event, { params: { extended: false } }],
  },
  {
    label: 'eventApi.deleteEventById',
    route: 'eventById',
    verb: 'delete',
    run: () => eventApi.deleteEventById(7),
    args: ['event/7/'],
  },
  {
    label: 'dailyTaskApi.updateDailyTask',
    route: 'dailyTaskById',
    verb: 'patch',
    run: () => dailyTaskApi.updateDailyTask(7, { completed: true }),
    args: ['daily-task/7/', { completed: true }],
  },
  {
    label: 'dailyTaskApi.deleteDailyTask',
    route: 'dailyTaskById',
    verb: 'delete',
    run: () => dailyTaskApi.deleteDailyTask(7),
    args: ['daily-task/7/'],
  },
  {
    label: 'tagApi.updateTag',
    route: 'tagById',
    verb: 'patch',
    run: () => tagApi.updateTag(7, { type: 'task', name: 'X', color: '#fff' }),
    args: ['tag/7/', { type: 'task', name: 'X', color: '#fff' }],
  },
  {
    label: 'tagApi.deleteTag',
    route: 'tagById',
    verb: 'delete',
    run: () => tagApi.deleteTag(7),
    args: ['tag/7/'],
  },
  {
    label: 'commonTaskApi.updateCommonTask',
    route: 'commonTaskById',
    verb: 'patch',
    run: () => commonTaskApi.updateCommonTask(7, { name: 'X', tagIds: [] }),
    args: ['common-task/7/', { name: 'X', tagIds: [] }],
  },
  {
    label: 'commonTaskApi.deleteCommonTask',
    route: 'commonTaskById',
    verb: 'delete',
    run: () => commonTaskApi.deleteCommonTask(7),
    args: ['common-task/7/'],
  },
  {
    label: 'feedbackApi.setFeedbackReadProperty',
    route: 'feedbackById',
    verb: 'patch',
    run: () => feedbackApi.setFeedbackReadProperty(7, true),
    args: ['feedback/7/', { isRead: true }],
  },
  {
    label: 'feedbackApi.deleteFeedback',
    route: 'feedbackById',
    verb: 'delete',
    run: () => feedbackApi.deleteFeedback(7),
    args: ['feedback/7/'],
  },
  {
    label: 'userApi.changeAccountState',
    route: 'userChangeAccountState',
    verb: 'post',
    run: () => userApi.changeAccountState(7, { active: false }),
    args: ['user/7/account-state/', { active: false }],
  },
  {
    label: 'userApi.resendActivationEmail',
    route: 'userResendActivationEmail',
    verb: 'post',
    run: () => userApi.resendActivationEmail(7),
    args: ['user/7/resend-activation-email/'],
  },
  {
    label: 'userApi.deleteUser',
    route: 'userById',
    verb: 'delete',
    run: () => userApi.deleteUser(7),
    args: ['user/7/'],
  },
]

afterEach(() => {
  vi.clearAllMocks()
})

describe('substitution des paramètres d’URL', () => {
  it.each(parameterisedRoutes)('$label', ({ verb, run, args }) => {
    run()

    expect(http[verb]).toHaveBeenCalledWith(...args)
  })

  it('n’exerce aucune route en laissant un paramètre non substitué', () => {
    for (const { run } of parameterisedRoutes) {
      vi.clearAllMocks()
      run()

      const [url] = Object.values(http).find(mock => mock.mock.calls.length)!.mock.calls[0]
      expect(url).not.toContain(':')
    }
  })

  it('couvre toutes les routes à paramètre déclarées', () => {
    const declared = Object.entries(apiRoutes)
      .filter(([, path]) => path.includes(':'))
      .map(([key]) => key)
    const covered = new Set(parameterisedRoutes.map(({ route }) => route))

    expect(declared.filter(key => !covered.has(key as keyof typeof apiRoutes))).toEqual([])
  })
})

describe('params par défaut et renommages', () => {
  it('force size=0 sur les listes non paginées', () => {
    projectApi.getProjectList()
    expect(http.get).toHaveBeenCalledWith('project/', { params: { size: 0 } })

    vi.clearAllMocks()
    projectApi.getProjectListDetailed()
    expect(http.get).toHaveBeenCalledWith('project/detailed/', { params: { size: 0 } })

    vi.clearAllMocks()
    collectionApi.getCollectionList()
    expect(http.get).toHaveBeenCalledWith('collection/', { params: { size: 0 } })

    vi.clearAllMocks()
    collectionApi.getCollectionListDetailed()
    expect(http.get).toHaveBeenCalledWith('collection/detailed/', { params: { size: 0 } })
  })

  it('laisse l’appelant écraser size', () => {
    projectApi.getProjectList({ size: 20 })

    expect(http.get).toHaveBeenCalledWith('project/', { params: { size: 20 } })
  })

  it('renomme les bornes du résumé quotidien en snake_case', () => {
    dailyTaskApi.getDailySummary('2026-03-01', '2026-03-31')

    expect(http.get).toHaveBeenCalledWith('daily-task/summary/', {
      params: { start_date: '2026-03-01', end_date: '2026-03-31' },
    })
  })

  it('force size=0 sur les tâches du jour', () => {
    dailyTaskApi.getDailyTasksByDate('2026-03-10')

    expect(http.get).toHaveBeenCalledWith('daily-task/', {
      params: { date: '2026-03-10', size: 0 },
    })
  })
})
