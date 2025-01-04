<script setup lang="ts">
import { DailySummary } from '@/models/daily-summary.model'
import { showScroll } from '@/utils/document.utils'
import DailyDetail from '@/views/daily/daily-summary/components/DailyDetail.vue'
import DailySummaryCardComponent from '@/views/daily/daily-summary/components/DailySummaryCard.vue'
import moment from 'moment'
import MainTitle from '@/components/MainTitle.vue'
import { onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { dailyTaskApi } from '@/api'

const display = useDisplay()
const router = useRouter()

const props = defineProps<{
  date?: string
}>()

const dailySummaryList = ref<DailySummary[]>([])
const dailyOverviewLoading = ref(false)
const dailyDetailDialog = ref(false)
const dateSelected = ref<string>('')

const today = moment().format('YYYY-MM-DD')
let daysPerPage = 21

onBeforeMount(() => {
  daysPerPage = calculateDaysPerPage()
  const endDate = moment()
    .subtract(daysPerPage - 1, 'days')
    .format('YYYY-MM-DD')
  retrieveDailySummaryList(today, endDate)
})

onMounted(() => {
  if (!props.date) return
  if (!moment(props.date).isValid()) removeDateParam()

  openDailyDetailDialog(props.date)
})

onUnmounted(() => {
  // The scroll can be deactivated if a daily-detail dialog is open.
  // So it is reset on unmounted if the user change route directly.
  showScroll()
})

// TODO : test if this work. Otherwise watch changes on route date param
watch(
  () => props.date,
  () => {
    if (!props.date) {
      dailyDetailDialog.value = false
      return
    }

    if (!moment(props.date).isValid()) removeDateParam()

    openDailyDetailDialog(props.date)
  }
)

function calculateDaysPerPage(): number {
  if (display.xs) return 10
  else if (display.smAndDown) return 14
  else if (display.lgAndDown) return 21
  else return 42 // for xl only
}

function retrieveDailySummaryList(startDate: string, endDate: string): void {
  dailyOverviewLoading.value = true
  dailyTaskApi
    .getDailySummary(startDate, endDate)
    .then(response => (dailySummaryList.value = dailySummaryList.value.concat(response)))
    .catch(error => console.error(error))
    .finally(() => (dailyOverviewLoading.value = false))
}

function loadNextPage(): void {
  const lastDailySummary = dailySummaryList.value.at(-1)
  if (!lastDailySummary) return

  const startDate = moment(lastDailySummary.date).subtract(1, 'days').format('YYYY-MM-DD')
  const endDate = moment(lastDailySummary.date).subtract(daysPerPage, 'days').format('YYYY-MM-DD')

  retrieveDailySummaryList(startDate, endDate)
}

function openDailyDetailDialog(date: string): void {
  dateSelected.value = date
  dailyDetailDialog.value = true
}

function dailyDetailDialogInput(value: boolean): void {
  if (!value) removeDateParam({ push: true })
}

function updateDailyTaskCompleted(date: string, numberOfDailyTaskCompleted: number): void {
  const dailyTaskSummary = dailySummaryList.value.find(d => d.date === date)
  if (dailyTaskSummary) dailyTaskSummary.totalTaskCompleted = numberOfDailyTaskCompleted
}

function setDateParam(date: string): void {
  router.push({ name: 'daily-summary', params: { date } })
}

function removeDateParam(options: { push?: boolean } = {}): void {
  const { push } = options
  if (push) router.push({ name: 'daily-summary' })
  else router.replace({ name: 'daily-summary' })
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row justify-space-between align-center mb-3 mb-md-6">
      <MainTitle icon="mdi-trophy" class="mb-3 mb-sm-0">Daily Summary</MainTitle>
      <v-btn
        :to="{ name: 'daily-update', params: { date: today, step: 'task' } }"
        color="accent"
        rounded
        variant="outlined">
        prepare the day
      </v-btn>
    </div>

    <div class="daily-wrapper">
      <DailySummaryCardComponent
        v-for="dailySummary in dailySummaryList"
        :key="dailySummary.date"
        :daily-summary="dailySummary"
        @open-daily-detail="setDateParam(dailySummary.date)">
      </DailySummaryCardComponent>
    </div>

    <div v-if="dailySummaryList.length" class="mt-5 d-flex justify-center">
      <v-btn :loading="dailyOverviewLoading" rounded @click="loadNextPage()">
        Load more days
      </v-btn>
    </div>

    <DailyDetail
      v-model="dailyDetailDialog"
      :date="dateSelected"
      @update:model-value="dailyDetailDialogInput($event)"
      @daily-task-completed="updateDailyTaskCompleted">
    </DailyDetail>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.daily-wrapper {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

  @media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
    grid-template-columns: repeat(auto-fit, minmax(288px, 1fr));
  }

  & > * {
    min-width: 0;
  }
}
</style>
