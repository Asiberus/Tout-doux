<script setup lang="ts">
import {
  DailyTask,
  DailyTaskDraft,
  DailyTaskPatch,
  DailyUpdateTaskTab,
} from '@/models/daily-task.model'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import DailyTaskFormCard from '@/views/daily/components/DailyTaskFormCard.vue'
import DailyTaskForm from '@/views/daily/components/DailyTaskForm.vue'
import { ComponentPublicInstance, computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useDisplay } from 'vuetify'

const { smAndDown, smAndUp } = useDisplay()

// todo : maybe change v-hover on daily task card

const props = defineProps<{
  date: string
  dailyTaskList: DailyTask[]
  carryOverCandidates: DailyTask[]
  carryOverInProgress: boolean
}>()

const emit = defineEmits<{
  create: [data: DailyTaskDraft]
  update: [event: { id: number; data: DailyTaskPatch }]
  delete: [id: number]
  select: [event: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }]
  'carry-over': []
}>()

const selectedDailyTask = ref<number | null>(null)
// Exposé au parent : sur mobile l'en-tête reste visible quand la feuille est repliée, et le « + »
// doit alors la dérouler sur le formulaire déjà ouvert
const createDailyTaskDisplayed = defineModel<boolean>('createDisplayed', { default: false })
const carryOverHovered = ref(false)
const createCard = useTemplateRef<ComponentPublicInstance>('createCard')

const carryOverDisplayed = computed<boolean>(
  () => props.dailyTaskList.length === 0 && props.carryOverCandidates.length > 0
)

// L'aperçu survit à la sortie du curseur pendant la requête : sans ça les cartes fantômes
// disparaîtraient au clic, avant que les vraies n'arrivent.
const previewDisplayed = computed<boolean>(
  () => carryOverDisplayed.value && (carryOverHovered.value || props.carryOverInProgress)
)

const carryOverTitle = computed<string>(() =>
  props.carryOverCandidates.length === 1
    ? "Copy yesterday's unfinished task"
    : `Copy ${props.carryOverCandidates.length} unfinished tasks from yesterday`
)

watch(createDailyTaskDisplayed, async (value: boolean) => {
  if (!value) return

  selectedDailyTask.value = null

  // Le formulaire naît en fin de liste, donc sous le bord du défileur ; `end` l'aligne sur ce bord
  await nextTick()
  createCard.value?.$el.scrollIntoView({ behavior: 'smooth', block: 'end' })
})

watch(selectedDailyTask, (value: number | null) => {
  if (value !== null) createDailyTaskDisplayed.value = false
})

watch(
  () => props.date,
  () => {
    selectedDailyTask.value = null
    createDailyTaskDisplayed.value = false
  }
)

function createDailyTask(data: DailyTaskDraft): void {
  createDailyTaskDisplayed.value = false
  emit('create', data)
}

function updateDailyTask(id: number, data: DailyTaskPatch): void {
  selectedDailyTask.value = null
  emit('update', { id, data })
}

function deleteDailyTask(id: number): void {
  emit('delete', id)
}

function select(event: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }): void {
  emit('select', event)
}

// Un `<button disabled>` ne reçoit pas d'événement souris dans Chrome : sans cette remise à
// zéro, le `mouseleave` serait perdu et l'aperçu resterait affiché après une erreur.
function carryOver(): void {
  carryOverHovered.value = false
  emit('carry-over')
}
</script>

<template>
  <div class="d-flex flex-column">
    <div class="daily-task-list__header task-sheet__drag-zone d-flex align-center">
      <h2 class="text-title-medium text-sm-headline-small font-weight-bold-sm-and-down mr-2">
        Tasks of the day
      </h2>
      <v-chip
        v-if="dailyTaskList.length > 0"
        :key="dailyTaskList.length"
        size="small"
        class="daily-task-list__counter">
        {{ dailyTaskList.length }}
      </v-chip>
      <v-spacer />
      <v-hover
        v-if="carryOverDisplayed"
        v-slot="{ props: hoverProps }"
        v-model="carryOverHovered"
        :open-delay="100">
        <v-btn
          v-bind="hoverProps"
          size="small"
          class="mr-1"
          :title="carryOverTitle"
          :loading="carryOverInProgress"
          :disabled="carryOverInProgress"
          @click="carryOver()">
          <v-icon :start="smAndUp" icon="mdi-history" />
          <template v-if="smAndUp">Copy tasks from yesterday</template>
        </v-btn>
      </v-hover>
      <v-btn
        icon
        density="comfortable"
        size="small"
        :variant="createDailyTaskDisplayed ? 'flat' : 'text'"
        :color="createDailyTaskDisplayed ? 'accent' : undefined"
        @click="createDailyTaskDisplayed = !createDailyTaskDisplayed">
        <v-icon icon="mdi-plus" />
      </v-btn>
    </div>

    <template v-if="dailyTaskList.length > 0 || createDailyTaskDisplayed || previewDisplayed">
      <div class="daily-task-wrapper">
        <template v-for="dailyTask of dailyTaskList" :key="dailyTask.id">
          <DailyTaskFormCard
            :daily-task="dailyTask"
            :edit-mode="selectedDailyTask === dailyTask.id"
            @show-edit-mode="selectedDailyTask = dailyTask.id"
            @hide-edit-mode="selectedDailyTask = null"
            @update="updateDailyTask(dailyTask.id, $event)"
            @delete="deleteDailyTask(dailyTask.id)"
            @select="select($event)" />
        </template>
        <template v-if="previewDisplayed">
          <!-- `inert` sort ces cartes du parcours clavier et de l'arbre d'accessibilité : ce ne
               sont pas encore des tâches -->
          <div
            v-for="candidate of carryOverCandidates"
            :key="'candidate-' + candidate.id"
            inert
            class="daily-task-preview">
            <DailyTaskFormCard :daily-task="candidate" :edit-mode="false" />
          </div>
        </template>
        <template v-if="createDailyTaskDisplayed">
          <v-card
            ref="createCard"
            :color="smAndDown ? 'surface-container-highest' : undefined"
            class="rounded-lg pa-4">
            <DailyTaskForm
              @submit="createDailyTask($event)"
              @close="createDailyTaskDisplayed = false" />
          </v-card>
        </template>
      </div>
    </template>

    <template v-else>
      <EmptyListDisplay message="You didn't add any task yet!" class="empty-list-display">
        <template #img>
          <img
            src="../../../../../../assets/no_tasks.svg"
            alt="No tasks"
            class="empty-list-display__img" />
        </template>
      </EmptyListDisplay>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

.daily-task-list__header {
  margin-bottom: 12px;
}

// Le `key` du chip le fait remonter à chaque valeur, ce qui rejoue l'animation — au chargement
// du jour comprise
.daily-task-list__counter {
  animation: counter-pop 0.26s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes counter-pop {
  40% {
    transform: scale(1.3);
  }
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
  // En feuille, l'en-tête reste au-dessus du défilement. Le `padding` remplace la marge, sinon
  // le contenu défilerait dans l'interstice laissé sous un en-tête collant
  .daily-task-list__header {
    position: sticky;
    top: 0;
    z-index: 1;
    margin-bottom: 0;
    padding-bottom: 12px;
    background: rgb(var(--v-theme-surface-container-high));
    cursor: pointer;
  }
}

.daily-task-wrapper {
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;

  // `.v-card` est en `overflow: hidden`, donc sa taille minimale automatique se résout à 0 au
  // lieu de la hauteur du contenu : sans ça les cartes se compriment au lieu de faire défiler
  > * {
    flex-shrink: 0;
  }

  @media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
    flex: 1 0 0;
  }
}

.daily-task-preview {
  opacity: 0.6;

  // `inert` n'est pas honoré par tous les navigateurs encore en circulation ; sans ça le menu
  // d'une carte fantôme pourrait s'ouvrir
  pointer-events: none;
}

.empty-list-display {
  flex-grow: 1;

  &__img {
    width: clamp(200px, 50%, 300px);
  }
}
</style>
