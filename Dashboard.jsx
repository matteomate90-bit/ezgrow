import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import UpcomingTasks from '../components/dashboard/UpcomingTasks';
import RecentActivity from '../components/dashboard/RecentActivity';
import GrowRoomSlider from '../components/dashboard/GrowRoomSlider';
import FloweringAlert from '../components/dashboard/FloweringAlert';
import StageAdvanceAlerts from '../components/dashboard/StageAdvanceAlerts';
import NotificationBell from '../components/dashboard/NotificationBell';
import usePlantStageScheduler, { autoAdvanceAutoflowering } from '../hooks/usePlantStageScheduler';
import usePushNotifications from '../hooks/usePushNotifications';
import { Sprout, ClipboardList, Thermometer, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: plants = [], isLoading: loadingPlants } = useQuery({
    queryKey: ['plants'],
    queryFn: () => base44.entities.Plant.list('-created_date'),
  });

  const { data: growRooms = [] } = useQuery({
    queryKey: ['growRooms'],
    queryFn: () => base44.entities.GrowRoom.list('created_date'),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.GrowTask.list('-created_date'),
  });

  const { data: envLogs = [] } = useQuery({
    queryKey: ['envLogs'],
    queryFn: () => base44.entities.EnvironmentLog.list('-log_date', 5),
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['journals'],
    queryFn: () => base44.entities.JournalEntry.list('-entry_date', 5),
  });

  const toggleTask = useMutation({
    mutationFn: (task) => base44.entities.GrowTask.update(task.id, { completed: !task.completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const activePlants = plants.filter(p => p.status === 'active');
  const pendingTasks = tasks.filter(t => !t.completed);
  const latestLog = envLogs[0];
  const stageAlerts = usePlantStageScheduler(activePlants);
  usePushNotifications(activePlants, tasks);

  // Auto-advance autofiorente veg→fioritura
  React.useEffect(() => {
    if (activePlants.length > 0) {
      autoAdvanceAutoflowering(activePlants, () => queryClient.invalidateQueries({ queryKey: ['plants'] }));
    }
  }, [activePlants.map(p => p.id + p.stage + p.plant_date).join(',')]); // eslint-disable-line

  const isLoading = loadingPlants || loadingTasks;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Il tuo giardino indoor a colpo d'occhio"
        action={<NotificationBell />}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Sprout} label="Piante Attive" value={activePlants.length} sub={`${plants.length} totali`} />
          <StatCard icon={ClipboardList} label="Attività in Sospeso" value={pendingTasks.length} sub={`${tasks.length} totali`} />
          <StatCard
            icon={Thermometer}
            label="Ultima Temp."
            value={latestLog?.temperature ? `${Math.round((latestLog.temperature - 32) * 5 / 9 * 10) / 10}°C` : '—'}
            sub={latestLog?.humidity ? `${latestLog.humidity}% UR` : 'Nessun log'}
          />
          <StatCard icon={BookOpen} label="Note nel Diario" value={journals.length} />
        </div>
      )}

      {/* Stage advance suggestions */}
      <StageAdvanceAlerts stageAlerts={stageAlerts} onAdvanced={() => queryClient.invalidateQueries({ queryKey: ['plants'] })} />

      {/* Flowering alerts */}
      <FloweringAlert plants={plants} />

      {/* Grow Room slider */}
      {!loadingPlants && growRooms.length > 0 && (
        <GrowRoomSlider growRooms={growRooms} plants={activePlants} allPlants={plants} />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingTasks tasks={pendingTasks} plants={plants} onToggle={(t) => toggleTask.mutate(t)} />
        <RecentActivity entries={journals} plants={plants} />
      </div>
    </div>
  );
}
