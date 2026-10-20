import { describe, expect, it } from 'vitest'
import {
  completionDelayLabel,
  dateLabel,
  dueDateChangeMessage,
  dueDateShortcuts,
  dueDateStatus,
} from '@/utils/due-date.utils'

const J = '2026-10-22'

describe('dueDateStatus', () => {
  it('renvoie none sans échéance ou pour une tâche terminée', () => {
    expect(dueDateStatus({ completed: false, dueDate: null }, J)).toBe('none')
    expect(dueDateStatus({ completed: true, dueDate: '2026-10-20' }, J)).toBe('none')
  })

  it('situe l’échéance par rapport au jour de référence', () => {
    expect(dueDateStatus({ completed: false, dueDate: '2026-10-21' }, J)).toBe('overdue')
    expect(dueDateStatus({ completed: false, dueDate: '2026-10-22' }, J)).toBe('today')
    expect(dueDateStatus({ completed: false, dueDate: '2026-10-27' }, J)).toBe('soon')
    expect(dueDateStatus({ completed: false, dueDate: '2026-10-28' }, J)).toBe('later')
  })
})

describe('dateLabel', () => {
  it('donne un libellé relatif jusqu’à 5 jours d’écart', () => {
    expect(dateLabel('2026-10-21', J, J)).toBe('1 day late')
    expect(dateLabel('2026-10-17', J, J)).toBe('5 days late')
    expect(dateLabel('2026-10-22', J, J)).toBe('Today')
    expect(dateLabel('2026-10-23', J, J)).toBe('Tomorrow')
    expect(dateLabel('2026-10-27', J, J)).toBe('Next Tuesday')
  })

  it('donne la date complète au-delà de 5 jours, passée ou future', () => {
    expect(dateLabel('2026-10-16', J, J)).toBe('16 October 2026')
    expect(dateLabel('2026-10-28', J, J)).toBe('28 October 2026')
    expect(dateLabel('2027-01-05', J, J)).toBe('5 January 2027')
  })
})

describe('dateLabel hors du jour courant', () => {
  it('affiche This day ou la date complète si J n’est pas aujourd’hui', () => {
    const today = '2026-10-19'
    expect(dateLabel('2026-10-22', J, today)).toBe('This day')
    expect(dateLabel('2026-10-21', J, today)).toBe('21 October 2026')
    expect(dateLabel('2026-10-23', J, today)).toBe('23 October 2026')
    expect(dateLabel('2026-10-25', J, today)).toBe('25 October 2026')
  })
})

describe('dateLabel pour une date de complétion', () => {
  it('parle du passé sans retard', () => {
    expect(dateLabel('2026-10-22', J, J, 'completed')).toBe('Today')
    expect(dateLabel('2026-10-21', J, J, 'completed')).toBe('Yesterday')
    expect(dateLabel('2026-10-19', J, J, 'completed')).toBe('3 days ago')
    expect(dateLabel('2026-10-10', J, J, 'completed')).toBe('10 October 2026')
  })

  it('affiche This day ou la date complète si J n’est pas aujourd’hui', () => {
    expect(dateLabel('2026-10-22', J, '2026-10-25', 'completed')).toBe('This day')
    expect(dateLabel('2026-10-21', J, '2026-10-25', 'completed')).toBe('21 October 2026')
  })
})

describe('completionDelayLabel', () => {
  it('donne le retard de complétion par rapport à l’échéance', () => {
    expect(completionDelayLabel('2026-10-22', '2026-10-21')).toBe('1 day late')
    expect(completionDelayLabel('2026-10-22', '2026-10-10')).toBe('12 days late')
  })

  it('ne dit rien sans échéance ou si la tâche est terminée à temps', () => {
    expect(completionDelayLabel('2026-10-22', null)).toBeNull()
    expect(completionDelayLabel('2026-10-22', '2026-10-22')).toBeNull()
    expect(completionDelayLabel('2026-10-20', '2026-10-22')).toBeNull()
  })
})

describe('dueDateShortcuts', () => {
  it('propose aujourd’hui, demain, vendredi prochain, semaine prochaine et fin de mois', () => {
    expect(dueDateShortcuts('2026-10-20')).toEqual([
      { label: 'Today', value: '2026-10-20' },
      { label: 'Tomorrow', value: '2026-10-21' },
      { label: 'Next Friday', value: '2026-10-23', detail: '23 Oct' },
      { label: 'Next week', value: '2026-10-26', detail: '26 Oct' },
      { label: 'End of month', value: '2026-10-31', detail: '31 Oct' },
    ])
  })

  it('ne propose pas vendredi prochain du vendredi au dimanche', () => {
    for (const day of ['2026-10-23', '2026-10-24', '2026-10-25']) {
      expect(dueDateShortcuts(day).map(({ label }) => label)).not.toContain('Next Friday')
    }
  })

  it('retire les raccourcis qui tombent le même jour qu’un précédent', () => {
    expect(dueDateShortcuts('2026-10-22').map(({ label }) => label)).toEqual([
      'Today',
      'Tomorrow',
      'Next week',
      'End of month',
    ])
    expect(dueDateShortcuts('2026-10-30').map(({ label }) => label)).toEqual([
      'Today',
      'Tomorrow',
      'Next week',
    ])
  })
})

describe('dueDateChangeMessage', () => {
  it('annonce la nouvelle échéance ou son retrait', () => {
    expect(dueDateChangeMessage('2026-10-23')).toBe('Due date moved to Friday 23 October')
    expect(dueDateChangeMessage(null)).toBe('Due date removed')
  })
})
