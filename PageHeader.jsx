import React from 'react';

export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-foreground text-xl font-semibold normal-case sm:text-3xl">{title}</h1>
        {description &&
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        }
      </div>
      {action && <div>{action}</div>}
    </div>);

}
