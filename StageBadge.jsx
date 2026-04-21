import React from 'react';
import { Badge } from '@/components/ui/badge';

const stageStyles = {
  seedling: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  vegetative: 'bg-green-100 text-green-700 border-green-200',
  flowering: 'bg-purple-100 text-purple-700 border-purple-200',
  harvesting: 'bg-amber-100 text-amber-700 border-amber-200',
  drying: 'bg-orange-100 text-orange-700 border-orange-200',
  curing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const stageLabels = {
  seedling: 'Germinazione',
  vegetative: 'Vegetativo',
  flowering: 'Fioritura',
  harvesting: 'Raccolta',
  drying: 'Essiccazione',
  curing: 'Stagionatura',
};

export default function StageBadge({ stage }) {
  return (
    <Badge variant="outline" className={`${stageStyles[stage] || 'bg-muted text-muted-foreground'} text-xs font-medium border`}>
      {stageLabels[stage] || stage?.replace(/_/g, ' ')}
    </Badge>
  );
}
