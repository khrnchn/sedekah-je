import React from "react";

interface SJHeaderProps {
  title: string;
  description: string;
}

export function SJHeader({ title, description }: SJHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
