import { useEffect, useCallback } from 'react';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';

const STORAGE_KEY = 'cultivapp_notif_sent';
const NOTIF_COOLDOWN_H = 8; // hours between same notification

function getLastSent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function markSent(key) {
  const data = getLastSent();
  data[key] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function shouldSend(key) {
  const data = getLastSent();
  if (!data[key]) return true;
  return Date.now() - data[key] > NOTIF_COOLDOWN_H * 3600 * 1000;
}

function sendNotif(title, body, tag) {
  if (!shouldSend(tag)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, tag, icon: '/favicon.ico' });
    markSent(tag);
  }
}

export function useRequestNotificationPermission() {
  const request = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
  }, []);
  return request;
}

export default function usePushNotifications(plants, tasks) {
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!plants?.length) return;

    const today = new Date();

    plants.forEach((plant) => {
      if (!plant || plant.status !== 'active') return;
      const daysOld = plant.plant_date ? differenceInDays(today, parseISO(plant.plant_date)) : null;

      // Stage advancement alerts
      if (plant.strain_type && plant.plant_date && daysOld !== null) {
        if ((plant.strain_type === 'autofiorente' || plant.strain_type === 'fotoperiodica') && plant.stage === 'seedling' && daysOld >= 10) {
          sendNotif(
            `🌱 ${plant.name} — Fase Completata`,
            `La germinazione è terminata (giorno ${daysOld}). Valuta di passare alla fase vegetativa.`,
            `stage_veg_${plant.id}`
          );
        }
        if (plant.strain_type === 'autofiorente' && plant.stage === 'vegetative' && daysOld >= 40) {
          sendNotif(
            `🌸 ${plant.name} — Pronta per la Fioritura`,
            `La tua autofiorente è al giorno ${daysOld}. Considera di avanzare alla fioritura.`,
            `stage_flower_${plant.id}`
          );
        }
      }

      // Harvest approaching (for flowering plants)
      if (plant.stage === 'flowering' && plant.flowering_start_date) {
        const floweringDays = plant.flowering_days_manual
          || (plant.genetics_info?.flowering_weeks_max ? plant.genetics_info.flowering_weeks_max * 7 : 63);
        const harvestDate = addDays(parseISO(plant.flowering_start_date), floweringDays);
        const daysToHarvest = differenceInDays(harvestDate, today);
        if (daysToHarvest <= 7 && daysToHarvest >= 0) {
          sendNotif(
            `🌾 ${plant.name} — Raccolta Imminente!`,
            `Raccolta prevista tra ${daysToHarvest} giorni (${format(harvestDate, 'dd/MM/yyyy')}). Inizia il flush!`,
            `harvest_soon_${plant.id}`
          );
        }
      }
    });

    // Task notifications
    if (tasks?.length) {
      const pendingTasks = tasks.filter(t => !t.completed && t.due_date);
      pendingTasks.forEach(task => {
        const daysUntil = differenceInDays(parseISO(task.due_date), today);
        if (daysUntil === 0) {
          sendNotif(
            `✅ Attività in Scadenza Oggi`,
            `"${task.title}"${task.plant_id ? '' : ''} — da completare oggi!`,
            `task_today_${task.id}`
          );
        } else if (daysUntil < 0) {
          sendNotif(
            `⚠️ Attività Scaduta`,
            `"${task.title}" era prevista ${Math.abs(daysUntil)} giorni fa.`,
            `task_overdue_${task.id}`
          );
        }
      });
    }
  }, [plants, tasks]);
}
