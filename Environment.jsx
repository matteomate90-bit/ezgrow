import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import EnvLogForm from '../components/environment/EnvLogForm';
import GrowRoomForm from '../components/environment/GrowRoomForm';
import PowerCostCalc from '../components/environment/PowerCostCalc';
import CartoonGrowRoom from '../components/environment/CartoonGrowRoom';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Thermometer, Droplets, Sun, Beaker, Trash2, Pencil, Home, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Environment() {
  const [showLogForm, setShowLogForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['growRooms'],
    queryFn: () => base44.entities.GrowRoom.list('created_date'),
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['envLogs'],
    queryFn: () => base44.entities.EnvironmentLog.list('-log_date', 200),
  });

  const { data: plants = [] } = useQuery({
    queryKey: ['plants'],
    queryFn: () => base44.entities.Plant.list('-created_date'),
  });

  const activeRoomId = selectedRoomId || rooms[0]?.id || null;
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  const roomLogs = logs.filter(l => l.grow_room_id === activeRoomId);
  const roomPlants = plants.filter(p => p.grow_room_id === activeRoomId && p.status === 'active');

  const toC = (f) => f != null ? Math.round((f - 32) * 5 / 9 * 10) / 10 : null;

  const chartData = [...roomLogs].reverse().slice(-14).map(log => ({
    date: format(new Date(log.log_date), 'dd/MM') + (log.log_time ? ` ${log.log_time}` : ''),
    temp: toC(log.temperature),
    humidity: log.humidity,
    ph: log.ph,
  }));

  const handleDeleteLog = async (id) => {
    await base44.entities.EnvironmentLog.delete(id);
    queryClient.invalidateQueries({ queryKey: ['envLogs'] });
  };

  const handleDeleteRoom = async (id) => {
    await base44.entities.GrowRoom.delete(id);
    queryClient.invalidateQueries({ queryKey: ['growRooms'] });
    if (selectedRoomId === id) setSelectedRoomId(null);
  };

  const isLoading = loadingRooms || loadingLogs;

  return (
    <div>
      <PageHeader
        title="Ambiente"
        description="Monitora temperatura, umidità, pH per ogni grow room"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditingRoom(null); setShowRoomForm(true); }}>
              <Home className="w-4 h-4 mr-2" /> Nuova Grow Room
            </Button>
            {activeRoom && (
              <Button onClick={() => setShowLogForm(true)}>
                <Plus className="w-4 h-4 mr-2" /> Aggiungi Lettura
              </Button>
            )}
          </div>
        }
      />

      {loadingRooms ? (
        <div className="flex gap-2 mb-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-32 rounded-xl" />)}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Nessuna Grow Room"
          description="Crea la tua prima grow room per iniziare a registrare i parametri ambientali."
          action={
            <Button onClick={() => { setEditingRoom(null); setShowRoomForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Crea Grow Room
            </Button>
          }
        />
      ) : (
        <>
          {/* Room Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {rooms.map(room => (
              <div key={room.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    activeRoomId === room.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {room.name}
                  <span className="ml-2 text-xs opacity-70">{room.layout}</span>
                </button>
                <button onClick={() => { setEditingRoom(room); setShowRoomForm(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDeleteRoom(room.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Cartoon grow room visualization */}
          <Card className="p-4 mb-6">
            <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Vista Grow Room · {roomPlants.length} piante
            </h3>
            <CartoonGrowRoom room={activeRoom} plants={roomPlants} />
          </Card>

          {/* Power Cost Calculator */}
          <PowerCostCalc room={activeRoom} />

          {/* Chart */}
          {chartData.length > 1 && (
            <Card className="p-5 mb-6">
              <h3 className="font-display text-base font-semibold mb-4">
                Andamento — {activeRoom?.name} (ultime 14 letture)
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="temp" stroke="hsl(var(--chart-1))" name="Temp °C" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity" stroke="hsl(var(--chart-3))" name="Umidità %" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ph" stroke="hsl(var(--chart-4))" name="pH" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Logs */}
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : roomLogs.length === 0 ? (
            <EmptyState
              icon={Thermometer}
              title="Nessun log per questa grow room"
              description="Aggiungi la prima lettura ambientale."
              action={<Button onClick={() => setShowLogForm(true)}><Plus className="w-4 h-4 mr-2" /> Aggiungi Lettura</Button>}
            />
          ) : (
            <div className="space-y-2">
              {roomLogs.map(log => (
                <Card key={log.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-xs text-muted-foreground w-28">
                      <p>{format(new Date(log.log_date), 'dd/MM/yy')}</p>
                      {log.log_time && (
                        <p className="flex items-center gap-0.5 mt-0.5">
                          <Clock className="w-3 h-3" /> {log.log_time}
                        </p>
                      )}
                    </div>
                    {log.temperature && (
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-sm font-medium">{toC(log.temperature)}°C</span>
                      </div>
                    )}
                    {log.humidity && (
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm font-medium">{log.humidity}%</span>
                      </div>
                    )}
                    {log.ph && (
                      <div className="flex items-center gap-1.5">
                        <Beaker className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-sm font-medium">pH {log.ph}</span>
                      </div>
                    )}
                    {log.light_hours && (
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-sm font-medium">{log.light_hours}h</span>
                      </div>
                    )}
                    {log.notes && <p className="text-xs text-muted-foreground italic">{log.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLog(log.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <EnvLogForm
        open={showLogForm}
        onOpenChange={setShowLogForm}
        growRooms={rooms}
        defaultRoomId={activeRoomId}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['envLogs'] })}
      />

      <GrowRoomForm
        open={showRoomForm}
        onOpenChange={setShowRoomForm}
        room={editingRoom}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['growRooms'] })}
      />
    </div>
  );
}
