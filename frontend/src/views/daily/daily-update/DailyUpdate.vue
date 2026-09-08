<script setup lang="ts">
import { dateFormat } from '@/pipes'
import DailyUpdateEvent from '@/views/daily/daily-update/steps/event/DailyUpdateEvent.vue'
import DailyUpdateTask from '@/views/daily/daily-update/steps/task/DailyUpdateTask.vue'
import SecondaryTitle from '@/components/SecondaryTitle.vue'
import { MAX_PLANNING_HORIZON_DAYS } from '@/utils/constants'
import moment from 'moment'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()
const router = useRouter()

const props = defineProps<{
  date: string
  step: 'task' | 'event'
}>()

onBeforeMount(() => {
  if (props.step === 'task') dailyStepper.value = 1
  else if (props.step === 'event') dailyStepper.value = 2
})

const dailyStepper = ref(1)
const dailyTaskCount = ref(0)
const dailyEventCount = ref(0)

// `dailyUpdateGuard` ne rejoue pas sur un changement de param (voir
// docs/architecture/routing.md) : ces deux bornes sont la seule chose qui empêche d'atteindre
// un jour passé ou au-delà de l'horizon.
const isToday = computed<boolean>(() => moment().isSame(props.date, 'day'))
const canGoForward = computed<boolean>(
  () => moment(props.date).diff(moment().startOf('day'), 'days') < MAX_PLANNING_HORIZON_DAYS
)

function goToDate(date: string): void {
  // `replace` et non `push` : une navigation jour à jour n'a pas à empiler autant d'entrées
  // d'historique qu'on a cliqué de flèches.
  router.replace({ name: 'daily-update', params: { date, step: props.step } })
}

function shiftDay(offset: number): void {
  goToDate(moment(props.date).add(offset, 'day').format('YYYY-MM-DD'))
}

function goToToday(): void {
  goToDate(moment().format('YYYY-MM-DD'))
}

function goToDailyDetail(): void {
  router.push({ name: 'daily-summary', params: { date: props.date } })
}

watch(dailyStepper, index => {
  const step = index === 1 ? 'task' : 'event'
  router.replace({ params: { step } })
})
</script>

<template>
  <div class="daily-update">
    <div class="d-flex flex-column flex-sm-row align-center gap-2 mb-2">
      <SecondaryTitle class="text-center text-sm-start">
        <span class="text-grey">Daily : </span>{{ dateFormat(date, 'dddd DD MMMM Y') }}
      </SecondaryTitle>

      <v-btn
        :disabled="dailyTaskCount === 0 && dailyEventCount === 0"
        color="accent"
        rounded
        class="daily-detail-btn align-self-center order-2 order-sm-3"
        @click="goToDailyDetail()">
        {{ isToday ? 'Start the day' : 'See the day' }}
        <v-icon icon="mdi-arrow-right" end />
      </v-btn>

      <div class="d-flex align-center gap-2 ml-0 ml-sm-auto order-3 order-sm-2">
        <v-btn
          v-if="xs || !isToday"
          icon
          :disabled="xs && isToday"
          variant="text"
          density="comfortable"
          class="today-btn"
          :size="xs ? 'small' : 'default'"
          title="Today"
          @click="goToToday()">
          <v-icon icon="mdi-calendar-heart" />
        </v-btn>
        <v-btn
          icon
          variant="text"
          density="comfortable"
          :size="xs ? 'small' : 'default'"
          :disabled="isToday"
          title="Previous day"
          class="previous-day-btn"
          @click="shiftDay(-1)">
          <v-icon icon="mdi-calendar-end" />
        </v-btn>
        <v-btn
          icon
          variant="text"
          density="comfortable"
          :size="xs ? 'small' : 'default'"
          :disabled="!canGoForward"
          title="Next day"
          @click="shiftDay(1)">
          <v-icon icon="mdi-calendar-end" />
        </v-btn>
      </div>
    </div>

    <v-stepper
      v-model="dailyStepper"
      non-linear
      alt-labels
      mobile-breakpoint="lg"
      class="daily-update-stepper">
      <v-stepper-header>
        <v-divider />
        <v-stepper-item
          :value="1"
          editable
          :color="dailyStepper === 1 ? 'accent' : 'stepperInactive'"
          icon="mdi-trophy"
          edit-icon="mdi-trophy">
          <template #title>
            Task
            <template v-if="dailyTaskCount > 0">({{ dailyTaskCount }})</template>
          </template>
        </v-stepper-item>
        <v-divider />
        <v-stepper-item
          :value="2"
          editable
          :color="dailyStepper === 2 ? 'accent' : 'stepperInactive'"
          icon="mdi-calendar-clock"
          edit-icon="mdi-calendar-clock">
          <template #title>
            Event
            <template v-if="dailyEventCount > 0">({{ dailyEventCount }})</template>
          </template>
        </v-stepper-item>
        <v-divider />
      </v-stepper-header>
      <v-stepper-window>
        <!-- `eager` : sans lui l'étape non sélectionnée n'est pas montée, son appel API ne part
             pas et son compteur reste vide dans l'en-tête du stepper.
             La transition est nommée pour échapper au glissé par défaut de `VWindow` : son
             `transform` sur l'étape ferait de celle-ci le bloc conteneur du panneau fixe de
             `DailyTaskBottomSheet`, qui se recalait alors dans la boîte de l'étape. Le fondu
             croisé n'anime qu'une opacité. Ne pas passer par la prop `crossfade` de `VWindow` :
             elle ajoute un `mix-blend-mode` permanent, dont le contexte d'empilement confinerait
             le `z-index` de la feuille sous la barre d'application -->
        <v-stepper-window-item
          :value="1"
          eager
          transition="v-window-crossfade-transition"
          reverse-transition="v-window-crossfade-transition">
          <DailyUpdateTask :date @daily-task-count="dailyTaskCount = $event" />
        </v-stepper-window-item>
        <v-stepper-window-item
          :value="2"
          eager
          transition="v-window-crossfade-transition"
          reverse-transition="v-window-crossfade-transition">
          <DailyUpdateEvent :date @daily-event-count="dailyEventCount = $event" />
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

.daily-update {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.previous-day-btn .v-icon {
  transform: scaleX(-1);
}

.daily-detail-btn {
  min-width: 160px;
}

.daily-update-stepper {
  flex: 1;
  display: flex;
  flex-direction: column;
  box-shadow: none !important;
  background: transparent !important;
  border: none !important;

  --stepper-avatar-size: 35px;
  --stepper-icon-size: 18px;

  // Taille de l'avatar codée en dur (`size: 24`) dans VStepperItem, donc posée en style inline
  :deep(.v-stepper-item__avatar.v-avatar) {
    width: var(--stepper-avatar-size) !important;
    height: var(--stepper-avatar-size) !important;

    .v-icon {
      font-size: var(--stepper-icon-size);
    }
  }

  :deep(.v-stepper-header) {
    box-shadow: none !important;
    margin-bottom: 4px;

    // V4 : le raccourci `margin` de `alt-labels` réécrase le reset des marges négatives sur les
    // dividers d'extrémité, qui débordent alors de 67px → scroll horizontal (overflow-x: auto)
    .v-divider:first-child {
      margin-inline-start: 0;
    }

    .v-divider:last-child {
      margin-inline-end: 0;
    }
  }

  :deep(.v-stepper-item) {
    border-radius: 8px;
  }

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    // `alt-labels` fige les étapes à `flex: 0 0 175px` : deux étapes = 350px incompressibles qui
    // se chevauchent de 45px sous 375px de large. À 50% chacune, toute la largeur est cliquable.
    :deep(.v-stepper-item) {
      padding: 8px;
      flex: 1 1 0;
      border-radius: 8px;
    }

    // Le titre est masqué en mode mobile, la marge sous l'avatar ne sépare plus rien
    :deep(.v-stepper-item__avatar.v-avatar) {
      margin-bottom: 0;
    }

    // Les dividers occuperaient la largeur que les étapes doivent se partager : le trait est
    // redessiné en fond, derrière les avatars
    :deep(.v-stepper-header) {
      .v-divider {
        display: none;
      }

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(var(--v-border-color), var(--v-border-opacity));
      }
    }
  }

  :deep(.v-stepper-window) {
    flex-grow: 1;
    min-height: 0;
    margin: 0 !important; // V4 remplace le padding du content par margin: 1.5rem
  }

  :deep(.v-window__container) {
    height: 100%;
  }

  :deep(.v-window-item) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>
