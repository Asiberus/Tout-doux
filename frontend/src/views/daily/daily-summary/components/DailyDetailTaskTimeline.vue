<script setup lang="ts">
import DailyTaskCard from '@/views/daily/components/DailyTaskCard.vue'
import DailyTaskForm from '@/views/daily/components/DailyTaskForm.vue'
import { DailyTask, DailyTaskDraft } from '@/models/daily-task.model'
import { useToday } from '@/composables/useToday'
import moment from 'moment/moment'
import { ComponentPublicInstance, computed, nextTick, useTemplateRef, watch } from 'vue'
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()

const props = defineProps<{
  dailyTaskList: DailyTask[]
  date: string
}>()

const emit = defineEmits<{
  'toggle-daily-task': [dailyTask: DailyTask]
  'create-daily-task': [data: DailyTaskDraft]
}>()

const createFormDisplayed = defineModel<boolean>('createFormDisplayed', { default: false })
const { today } = useToday()
const isPast = computed<boolean>(() => moment(props.date).isBefore(today.value, 'day'))
const isFuture = computed<boolean>(() => moment(props.date).isAfter(today.value, 'day'))
const isToday = computed<boolean>(() => !isPast.value && !isFuture.value)
const addTaskCardVariant = computed<'elevated' | 'outlined'>(() =>
  createFormDisplayed.value ? 'elevated' : 'outlined'
)

const addTaskCard = useTemplateRef<ComponentPublicInstance>('addTaskCard')

watch(
  () => props.date,
  () => (createFormDisplayed.value = false)
)

watch(createFormDisplayed, async value => {
  if (!value) return
  await nextTick()
  const card: HTMLElement | undefined = addTaskCard.value?.$el
  const scroller = card?.closest<HTMLElement>('.v-overlay__content')
  if (!card || !scroller) return

  // En lg, la colonne des événements peut descendre plus bas que le formulaire : le bas du
  // conteneur est borné pour ne jamais faire passer le haut du formulaire sous le bord supérieur
  const formTop =
    scroller.scrollTop + card.getBoundingClientRect().top - scroller.getBoundingClientRect().top
  scroller.scrollTo({
    top: Math.min(scroller.scrollHeight - scroller.clientHeight, formTop),
    behavior: 'smooth',
  })
})

const numberOfDailyTaskCompleted = computed<number>(
  () => props.dailyTaskList.filter(({ completed }) => completed).length
)
const numberOfDailyTaskUncompleted = computed<number>(
  () => props.dailyTaskList.filter(({ completed }) => !completed).length
)
const taskText = computed<string>(() => {
  if (isFuture.value) {
    return props.dailyTaskList.length > 1
      ? `${props.dailyTaskList.length} tasks planned for that day`
      : '1 task planned for that day'
  }

  if (isToday.value) {
    if (numberOfDailyTaskUncompleted.value > 0)
      return `You have ${numberOfDailyTaskUncompleted.value} ${
        numberOfDailyTaskUncompleted.value > 1 ? 'tasks' : 'task'
      } left to do today!`
    else return 'All tasks done for today! :)'
  } else {
    if (numberOfDailyTaskCompleted.value === props.dailyTaskList.length)
      return 'All tasks completed for that day! :)'
    else if (numberOfDailyTaskCompleted.value > 0)
      return `${numberOfDailyTaskCompleted.value} on ${props.dailyTaskList.length} tasks were completed that day`
    else return 'No tasks completed that day :('
  }
})

function toggleDailyTask(dailyTask: DailyTask): void {
  // Le serveur refuse `completed` sur un jour à venir : ne pas laisser la carte en donner l'air.
  if (isFuture.value) return
  emit('toggle-daily-task', dailyTask)
}

function createDailyTask(data: DailyTaskDraft): void {
  createFormDisplayed.value = false
  emit('create-daily-task', data)
}
</script>

<template>
  <div>
    <h4 class="text-headline-small text-lg-headline-large">
      Tasks
      <v-chip size="small">
        {{ numberOfDailyTaskCompleted }}
        /
        {{ dailyTaskList.length }}
      </v-chip>
    </h4>
    <p class="text-body-large text-grey-lighten-1">
      {{ taskText }}
    </p>

    <v-timeline density="compact" truncate-line="both">
      <v-timeline-item
        v-for="dailyTask in dailyTaskList"
        :key="`daily-task-${dailyTask.id}`"
        fill-dot
        :size="xs ? 'small' : 'default'"
        :dot-color="dailyTask.completed ? 'green-darken-2' : 'surface'">
        <template #icon>
          <div
            v-ripple="!isFuture"
            class="icon-wrapper"
            :class="{ 'icon-wrapper--inert': isFuture }"
            @click="toggleDailyTask(dailyTask)">
            <v-icon v-if="dailyTask.completed" icon="mdi-check" :size="xs ? 'small' : 'default'" />
            <v-icon v-else icon="mdi-trophy" :size="xs ? 'small' : 'default'" />
          </div>
        </template>
        <DailyTaskCard
          :daily-task="dailyTask"
          caret
          :toggleable="!isFuture"
          @toggle="toggleDailyTask(dailyTask)" />
      </v-timeline-item>

      <v-timeline-item
        v-if="!isPast"
        :size="xs ? 'small' : 'default'"
        :line-inset="2"
        class="add-task-item"
        :class="{ 'add-task-item--editing': createFormDisplayed }">
        <template #icon>
          <v-icon icon="mdi-plus" :size="xs ? 'small' : 'default'" class="add-task-icon" />
        </template>

        <v-card
          ref="addTaskCard"
          :variant="addTaskCardVariant"
          :link="!createFormDisplayed"
          :ripple="false"
          class="add-task-card rounded-lg pa-3 pa-sm-4 ps-5 ps-sm-6"
          :class="{ 'add-task-card--idle': !createFormDisplayed }"
          @click="createFormDisplayed = true">
          <span
            v-if="!createFormDisplayed"
            class="text-body-medium text-sm-body-large font-weight-medium">
            Add a task
          </span>
          <DailyTaskForm
            v-else
            @click.stop
            @submit="createDailyTask($event)"
            @close="createFormDisplayed = false" />
        </v-card>
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/colors';
@use '@/styles/breakpoints' as variables;
@use '@/styles/caret';

$add-task-color-idle: map.get(colors.$grey, 'darken-3');
$add-task-color-active: map.get(colors.$grey, 'darken-1');
$add-task-transition: all 0.2s ease-in-out;

$rail-color: rgba(var(--v-border-color), var(--v-border-opacity));
$rail-dash: 3px;
$rail-period: 6px;

.v-timeline {
  padding-top: 0;

  --bar-left: 48px;
  --divider-width: 96px;
  --divider-justify-content: center;
  // Vuetify fait dépasser chaque segment du rail de 12px en dur, la moitié de son `row-gap` : l'écart
  // et ce dépassement passent par la même variable pour que les segments restent jointifs
  --rail-overhang: 12px;
  row-gap: calc(2 * var(--rail-overhang));

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    --bar-left: 11px;
    --divider-width: 40px;
    --rail-overhang: 6px;
  }

  @media #{map.get(variables.$display-breakpoints, 'sm')} {
    --bar-left: 18px;
    --divider-width: 55px;
    --rail-overhang: 9px;
  }

  // Le modificateur est nécessaire pour égaler la spécificité du sélecteur Vuetify qui pose ces 24px
  &.v-timeline--side-end .v-timeline-item :deep(.v-timeline-item__body) {
    padding-inline-start: 0;

    @media #{map.get(variables.$display-breakpoints, 'sm')} {
      padding-inline-start: 8px;
    }

    @media #{map.get(variables.$display-breakpoints, 'xs')} {
      padding-inline-start: 12px;
    }
  }

  .v-timeline-item :deep(.v-timeline-divider__before) {
    top: calc(-1 * var(--rail-overhang));
    height: calc(
      var(--v-timeline-line-size-base) + var(--rail-overhang) - var(--v-timeline-line-inset)
    );
  }

  .v-timeline-item :deep(.v-timeline-divider__after) {
    bottom: calc(-1 * var(--rail-overhang));
    height: calc(
      var(--v-timeline-line-size-base) + var(--rail-overhang) - var(--v-timeline-line-inset)
    );
  }

  .v-timeline-item {
    & :deep(.v-timeline-item__body) {
      width: 100%;
    }

    & :deep(.v-timeline-divider) {
      min-width: var(--divider-width);
      justify-content: var(--divider-justify-content);
    }
  }

  .add-task-item {
    --add-task-color: #{$add-task-color-idle};
    --add-task-dot-color: var(--add-task-color);
    --add-task-icon-color: var(--add-task-color);

    color: var(--add-task-color);

    &--editing {
      --add-task-color: #{$add-task-color-active};
    }

    & :deep(.v-timeline-divider__dot),
    & :deep(.v-timeline-divider__inner-dot) {
      background: transparent;
    }

    & :deep(.v-timeline-divider__dot) {
      border: thin dashed var(--add-task-dot-color);
      transition: $add-task-transition;
    }

    // Le rail est une div remplie en `background`, pas une bordure : `dashed` n'y ferait rien
    & :deep(.v-timeline-divider__before) {
      background-color: transparent;
      background-image: repeating-linear-gradient(
        to bottom,
        $rail-color 0 $rail-dash,
        transparent $rail-dash $rail-period
      );
    }
  }

  // Le segment qui mène au dot fantôme est fait de deux div : ce `__after` en couvre la moitié
  // haute, jusqu'au milieu du `row-gap`. Son motif part de la jonction (`to top`) et commence par
  // un vide, pour que le pointillé reste régulier à la rencontre des deux segments
  .v-timeline-item:has(+ .add-task-item) :deep(.v-timeline-divider__after) {
    background-color: transparent;
    background-image: repeating-linear-gradient(
      to top,
      transparent 0 $rail-dash,
      $rail-color $rail-dash $rail-period
    );
  }

  // La carte est la même dans les deux états : recréée, elle n'aurait aucune valeur de départ à
  // animer et atteindrait sa couleur finale avant le dot, qui lui survit au basculement
  .add-task-card {
    @include caret.card;
    @include caret.dashed-outline;
    transition: $add-task-transition;

    &:not(.add-task-card--idle)::before,
    &:not(.add-task-card--idle)::after {
      border-color: transparent;
    }
  }

  .add-task-icon {
    color: var(--add-task-icon-color);
    transition: $add-task-transition;
  }

  // L'icône vit dans le divider, rendu avant le corps qui porte la carte : aucun sélecteur de
  // voisinage ne peut remonter de la carte survolée jusqu'à elle
  @media (hover: hover) {
    .add-task-item:has(.add-task-card--idle:hover) {
      --add-task-color: #{$add-task-color-active};
    }
  }

  .icon-wrapper {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;

    &--inert {
      cursor: default;
    }
  }
}
</style>
