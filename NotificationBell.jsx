import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { useRequestNotificationPermission } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';

export default function NotificationBell() {
  const [permission, setPermission] = useState('Notification' in window ? Notification.permission : 'unsupported');
  const requestPermission = useRequestNotificationPermission();

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
  }, []);

  const handleEnable = async () => {
    const result = await requestPermission();
    setPermission(result);
  };

  if (permission === 'unsupported') return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          {permission === 'granted'
            ? <Bell className="w-4 h-4 text-primary" />
            : <BellOff className="w-4 h-4 text-muted-foreground" />
          }
          {permission !== 'granted' && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        {permission === 'granted' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
              <Check className="w-4 h-4" /> Notifiche attive
            </div>
            <p className="text-xs text-muted-foreground">
              Riceverai avvisi per: avanzamento fasi, raccolta imminente e attività in scadenza.
            </p>
          </div>
        ) : permission === 'denied' ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Notifiche bloccate</p>
            <p className="text-xs text-muted-foreground">
              Hai bloccato le notifiche. Abilitale nelle impostazioni del browser per questo sito.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Abilita Notifiche Push</p>
            <p className="text-xs text-muted-foreground">
              Ricevi avvisi su: avanzamento fasi di crescita, raccolto imminente e attività in scadenza.
            </p>
            <Button size="sm" className="w-full" onClick={handleEnable}>
              <Bell className="w-3.5 h-3.5 mr-1.5" /> Abilita Notifiche
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
