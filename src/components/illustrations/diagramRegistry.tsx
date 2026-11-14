import React from 'react';
import { REDIS_DIAGRAMS } from './RedisDiagrams';
import { KUBE_DIAGRAMS } from './KubeDiagrams';
import { CICD_DIAGRAMS } from './CicdDiagrams';
import { PYTHON_DIAGRAMS } from './PythonDiagrams';

export interface TechnicalDiagramProps {
  isLight: boolean;
  className?: string;
}

export type DiagramRenderer = React.FC<TechnicalDiagramProps>;

const ALL_DIAGRAMS: Record<string, DiagramRenderer> = {
  ...REDIS_DIAGRAMS,
  ...KUBE_DIAGRAMS,
  ...CICD_DIAGRAMS,
  ...PYTHON_DIAGRAMS,
};

export function hasTechnicalDiagram(diagramId?: string): boolean {
  if (!diagramId) return false;
  return Boolean(ALL_DIAGRAMS[diagramId]);
}

export function getTechnicalDiagramIds(): string[] {
  return Object.keys(ALL_DIAGRAMS);
}

export const TechnicalDiagramCanvas: React.FC<{
  diagramId: string;
  isLight: boolean;
  className?: string;
}> = ({ diagramId, isLight, className }) => {
  const Comp = ALL_DIAGRAMS[diagramId];
  if (!Comp) return null;
  return <Comp isLight={isLight} className={className} />;
};
