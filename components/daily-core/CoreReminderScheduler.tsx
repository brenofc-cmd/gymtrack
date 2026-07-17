'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { coreWeekday, localDateISO } from '@/lib/daily-core/logic'

function playReminderTone() {
  const AudioContextClass = window.AudioContext
  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = 660
  gain.gain.value = 0.04
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.18)
}
export function CoreReminderScheduler() {
  useEffect(() => {
    const supabase = createClient()
    async function checkReminder() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data: reminder } = await supabase.from('daily_core_reminders').select('*').eq('user_id', auth.user.id).maybeSingle()
      if (!reminder?.enabled || !reminder.weekdays.includes(coreWeekday())) return
      const now = new Date()
      if (reminder.disabled_until && new Date(reminder.disabled_until) > now) return
      if (reminder.snoozed_until && new Date(reminder.snoozed_until) > now) return
      const today = localDateISO(now)
      if (reminder.last_notified_on === today) return
      const [hours, minutes] = reminder.reminder_time.split(':').map(Number)
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (currentMinutes < hours * 60 + minutes) return
      if (reminder.sound_enabled) playReminderTone()
      if (reminder.vibration_enabled) navigator.vibrate?.([120, 60, 120])
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Abdômen Diário', { body: 'Sua rotina matinal está pronta.', tag: `daily-core-${today}` })
        notification.onclick = () => { window.focus(); window.location.assign('/abdomen') }
      }
      toast('Abdômen Diário', {
        description: 'Sua rotina matinal está pronta.',
        action: {
          label: 'Adiar 10 min',
          onClick: () => supabase.from('daily_core_reminders').update({ snoozed_until: new Date(Date.now() + 600_000).toISOString(), last_notified_on: null }).eq('user_id', auth.user!.id),
        },
      })
      await supabase.from('daily_core_reminders').update({ last_notified_on: today, snoozed_until: null }).eq('user_id', auth.user.id)
    }
    void checkReminder()
    const interval = window.setInterval(() => void checkReminder(), 60_000)
    return () => window.clearInterval(interval)
  }, [])
  return null
}
