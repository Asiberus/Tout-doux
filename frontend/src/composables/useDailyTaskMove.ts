import { Ref } from 'vue'
import { dailyTaskApi } from '@/api'
import { DailyTask } from '@/models/daily-task.model'
import { MoveAnchors } from '@/models/ordering.model'
import { useNotificationStore } from '@/store/notification.store'
import { applyMove, createMoveQueue, moveFailureMessage } from '@/utils/ordering.utils'

export function useDailyTaskMove(
  dailyTaskList: Ref<DailyTask[]>,
  reload: () => void
): { moveDailyTask: (dailyTaskId: number, anchors: MoveAnchors) => Promise<void> } {
  const notificationStore = useNotificationStore()
  const queue = createMoveQueue(error => {
    notificationStore.notifyError(moveFailureMessage(error))
    reload()
  })

  function moveDailyTask(dailyTaskId: number, anchors: MoveAnchors): Promise<void> {
    applyMove(dailyTaskList.value, dailyTaskId, anchors)
    return queue.enqueue(async () => {
      const { position } = await dailyTaskApi.moveDailyTask(dailyTaskId, anchors)
      const dailyTask = dailyTaskList.value.find(({ id }) => id === dailyTaskId)
      if (dailyTask) dailyTask.position = position
    })
  }

  return { moveDailyTask }
}
