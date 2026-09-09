<script setup lang="ts">
import FilterChip from '@/components/FilterChip.vue'
import { DailySummary } from '@/models/daily-summary.model'
import { MAX_PLANNING_HORIZON_DAYS } from '@/utils/constants'
import { showScroll } from '@/utils/document.utils'
import DailyDetail from '@/views/daily/daily-summary/components/DailyDetail.vue'
import DailySummaryCardComponent from '@/views/daily/daily-summary/components/DailySummaryCard.vue'
import moment from 'moment'
import MainTitle from '@/components/MainTitle.vue'
import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { dailyTaskApi } from '@/api'

const display = useDisplay()
const route = useRoute()
const router = useRouter()

const props = defineProps<{
  date?: string
  upcoming: boolean
}>()

const pastSummaryList = ref<DailySummary[]>([])
const upcomingSummaryList = ref<DailySummary[]>([])
const pastLoading = ref(false)
const upcomingLoading = ref(false)
const dailyDetailDialog = ref(false)
const dateSelected = ref<string>('')

const today = moment().format('YYYY-MM-DD')
// Le plafond est figé au montage, comme `today` — même limite, suivie en R12.
const upcomingCeiling = moment().startOf('day').add(MAX_PLANNING_HORIZON_DAYS, 'days')
let daysPerPage = 21

const displayedSummaryList = computed<DailySummary[]>(() =>
  props.upcoming ? upcomingSummaryList.value : pastSummaryList.value
)

const upcomingCeilingReached = computed<boolean>(() => {
  const furthest = upcomingSummaryList.value.at(-1)
  return !!furthest && !moment(furthest.date).isBefore(upcomingCeiling)
})

onBeforeMount(() => {
  daysPerPage = calculateDaysPerPage()
  // `daysPerPage` doit être calculé avant : un `watch` en `immediate` partirait sur la valeur
  // par défaut. Le watcher plus bas ne couvre que les bascules ultérieures du chip.
  loadMore()
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

watch(
  () => props.upcoming,
  () => {
    if (displayedSummaryList.value.length === 0) loadMore()
  }
)

function calculateDaysPerPage(): number {
  if (display.xs.value) return 10
  else if (display.smAndDown.value) return 14
  else if (display.lgAndDown.value) return 21
  else return 42 // for xl only
}

function retrieveDailySummaryList(startDate: string, endDate: string): void {
  pastLoading.value = true
  dailyTaskApi
    .getDailySummary(startDate, endDate)
    .then(response => (pastSummaryList.value = pastSummaryList.value.concat(response)))
    .catch(error => console.error(error))
    .finally(() => (pastLoading.value = false))
}

function loadMore(): void {
  if (props.upcoming) loadUpcomingPage()
  else loadPastPage()
}

function loadPastPage(): void {
  const furthest = pastSummaryList.value.at(-1)
  // Aucune page chargée : on part de demain pour que la première borne tombe sur aujourd'hui,
  // exactement comme les pages suivantes partent du lendemain de leur dernier jour.
  const from = furthest ? moment(furthest.date) : moment().startOf('day').add(1, 'days')

  retrieveDailySummaryList(
    from.clone().subtract(1, 'days').format('YYYY-MM-DD'),
    from.clone().subtract(daysPerPage, 'days').format('YYYY-MM-DD')
  )
}

function loadUpcomingPage(): void {
  const furthest = upcomingSummaryList.value.at(-1)
  const from = furthest ? moment(furthest.date) : moment().startOf('day')

  upcomingLoading.value = true
  dailyTaskApi
    // Seul appel du front dont les bornes sont passées dans l'ordre de leurs noms, la plus
    // proche d'abord : `daterange` parcourt alors en avant et la réponse arrive croissante,
    // prête à être poussée en queue. L'appel du passé, juste au-dessus, fait l'inverse.
    .getDailySummary(
      from.clone().add(1, 'days').format('YYYY-MM-DD'),
      moment.min(from.clone().add(daysPerPage, 'days'), upcomingCeiling).format('YYYY-MM-DD')
    )
    .then(response => upcomingSummaryList.value.push(...response))
    .catch(error => console.error(error))
    .finally(() => (upcomingLoading.value = false))
}

function openDailyDetailDialog(date: string): void {
  dateSelected.value = date
  dailyDetailDialog.value = true
}

function dailyDetailDialogInput(value?: boolean): void {
  if (!value) removeDateParam({ push: true })
}

function findSummary(date: string): DailySummary | undefined {
  return (
    pastSummaryList.value.find(d => d.date === date) ??
    upcomingSummaryList.value.find(d => d.date === date)
  )
}

function updateDailyTaskCompleted(date: string, numberOfDailyTaskCompleted: number): void {
  const dailyTaskSummary = findSummary(date)
  if (dailyTaskSummary) dailyTaskSummary.totalTaskCompleted = numberOfDailyTaskCompleted
}

function incrementDailyTaskTotal(date: string): void {
  const dailyTaskSummary = findSummary(date)
  if (dailyTaskSummary) dailyTaskSummary.totalTask++
}

function toggleUpcoming(): void {
  router.replace({ query: { ...route.query, upcoming: (!props.upcoming).toString() } })
}

function goToDate(date: string): void {
  // `replace` : parcourir les jours un à un n'a pas à empiler autant d'entrées d'historique.
  router.replace({ name: 'daily-summary', params: { date }, query: route.query })
}

// `route.query` est réinjecté partout : sans lui, ouvrir ou fermer le dialog de détail
// effacerait l'état du chip de l'URL.
function setDateParam(date: string): void {
  router.push({ name: 'daily-summary', params: { date }, query: route.query })
}

function removeDateParam(options: { push?: boolean } = {}): void {
  const { push } = options
  const location = { name: 'daily-summary', query: route.query }
  if (push) router.push(location)
  else router.replace(location)
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row justify-space-between align-center mb-3 mb-md-6">
      <MainTitle icon="mdi-trophy" class="mb-3 mb-sm-0">Daily Summary</MainTitle>

      <div class="d-flex align-center gap-2">
        <FilterChip
          :model-value="upcoming"
          color="accent"
          size="large"
          icon="mdi-calendar-arrow-right"
          @update:model-value="toggleUpcoming()">
          Upcoming
        </FilterChip>

        <v-btn
          :to="{ name: 'daily-update', params: { date: today, step: 'task' } }"
          color="accent"
          rounded
          variant="outlined">
          prepare the day
        </v-btn>
      </div>
    </div>

    <div class="daily-wrapper">
      <DailySummaryCardComponent
        v-for="dailySummary in displayedSummaryList"
        :key="dailySummary.date"
        :daily-summary="dailySummary"
        :upcoming
        @open-daily-detail="setDateParam(dailySummary.date)">
      </DailySummaryCardComponent>
    </div>

    <div v-if="displayedSummaryList.length" class="mt-5 d-flex justify-center">
      <v-btn
        :loading="upcoming ? upcomingLoading : pastLoading"
        :disabled="upcoming && upcomingCeilingReached"
        rounded
        @click="loadMore()">
        Load more days
      </v-btn>
    </div>

    <DailyDetail
      v-model="dailyDetailDialog"
      :date="dateSelected"
      @update:model-value="dailyDetailDialogInput($event)"
      @daily-task-completed="updateDailyTaskCompleted"
      @daily-task-created="incrementDailyTaskTotal"
      @navigate="goToDate($event)">
    </DailyDetail>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

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
