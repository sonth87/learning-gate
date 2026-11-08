import { SkillLevel } from './curriculum.types';

export type SampleFileType = 'python' | 'toml' | 'dockerfile' | 'json' | 'markdown';

export interface SampleProjectFile {
  /** Path relative to project root, e.g. "src/hello_app/main.py" */
  path: string;
  /** Short explanation of why this file exists and its role in the architecture */
  roleDescription: string;
  /** Key Pythonic / engineering highlights in this file */
  keyPatterns: string[];
  language: SampleFileType;
  code: string;
}

export type InteractiveActionKind = 'run' | 'curl' | 'pytest' | 'lint';

export interface SampleInteractiveCommand {
  id: string;
  label: string;
  kind: InteractiveActionKind;
  command: string;
  description: string;
  /** Optional HTTP metadata for API/cURL calls */
  httpMeta?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    statusCode: number;
    statusText: string;
    latencyMs: number;
    requestBody?: string;
  };
  stdout: string;
}

export interface SampleProject {
  id: string;
  number: number;
  slug: string;
  title: string;
  complexity: SkillLevel;
  complexityLabel: string;
  category: string;
  summary: string;
  architectureNotes: string[];
  techStack: string[];
  defaultFilePath: string;
  files: SampleProjectFile[];
  interactiveCommands: SampleInteractiveCommand[];
}
