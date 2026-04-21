import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import StageBadge from '../shared/StageBadge';
import { format, differenceInDays } from 'date-fns';
import { Sprout, Calendar } from 'lucide-react';

export default function PlantCard({ plant }) {
  const daysSincePlant = plant.plant_date
    ? differenceInDays(new Date(), new Date(plant.plant_date))
    : null;

  return (
    <Link to={`/plants/${plant.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {plant.photo_url ? (
            <img
              src={plant.photo_url}
              alt={plant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sprout className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <StageBadge stage={plant.stage} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground truncate">{plant.name}</h3>
          {plant.strain && (
            <p className="text-sm text-muted-foreground truncate">{plant.strain}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {plant.medium && (
              <span className="capitalize">{{ soil: 'Terra', coco_coir: 'Cocco', hydroponics: 'Idroponica', aeroponics: 'Aeroponica', dwc: 'DWC', other: 'Altro' }[plant.medium] || plant.medium.replace(/_/g, ' ')}</span>
            )}
            {daysSincePlant !== null && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Giorno {daysSincePlant}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
