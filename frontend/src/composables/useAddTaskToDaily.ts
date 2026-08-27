import { dailyTaskApi } from '@/api'
import { useNotificationStore } from '@/store'
import { isAxiosError } from 'axios'

export function useAddTaskToDaily(): { addTaskToDaily: (taskId: number) => void } {
  const notificationStore = useNotificationStore()

  function addTaskToDaily(taskId: number): void {
    dailyTaskApi.createDailyTask({ taskId }).then(
      () => notificationStore.notifySuccess("Task added to today's daily"),
      error => {
        // 409 : la task y est déjà. Du point de vue de l'utilisateur le résultat est le même.
        if (isAxiosError(error) && error.response?.status === 409)
          notificationStore.notifySuccess("Task added to today's daily")
        else {
          console.error(error)
          notificationStore.notifyError("Could not add the task to today's daily")
        }
      }
    )
  }

  return { addTaskToDaily }
}
