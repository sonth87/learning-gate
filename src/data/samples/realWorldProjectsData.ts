import { REAL_WORLD_PROJECT_GROUPS } from './realWorldGroups';
import { REAL_WORLD_PROJECTS_PART_1 } from './realWorldProjectsPart1';
import { REAL_WORLD_PROJECTS_PART_2 } from './realWorldProjectsPart2';
import {
  RealWorldProject,
  RealWorldProjectGroup,
} from '@/types/realWorldProject.types';
import { SampleProject } from '@/types/sample.types';

export { REAL_WORLD_PROJECT_GROUPS };

export const ALL_REAL_WORLD_PROJECTS: RealWorldProject[] = [
  ...REAL_WORLD_PROJECTS_PART_1,
  ...REAL_WORLD_PROJECTS_PART_2,
];

export function getProjectsByGroup(groupId: string): RealWorldProject[] {
  return ALL_REAL_WORLD_PROJECTS.filter((p) => p.groupId === groupId);
}

export function getGroupById(
  groupId: string
): RealWorldProjectGroup | undefined {
  return REAL_WORLD_PROJECT_GROUPS.find((g) => g.id === groupId);
}

export const REAL_WORLD_AS_SAMPLE_PROJECTS: SampleProject[] =
  ALL_REAL_WORLD_PROJECTS.map((rw, idx) => {
    const group = getGroupById(rw.groupId);
    const slug = rw.id.replace(/^rw-/, '');
    return {
      id: rw.id,
      number: 17 + idx,
      slug,
      title: rw.title,
      complexity: rw.complexity,
      complexityLabel: `${group ? `Nhóm ${group.number}` : 'Thực tế'} • ${
        rw.kind === 'production-template' ? 'Production Template' : 'PBL Tutorial'
      }`,
      category: group ? group.title : rw.scaleLabel,
      summary: `${rw.summary} — Mục đích: ${rw.purpose}`,
      architectureNotes: [
        ...rw.howItWorks,
        ...rw.libraries.map(
          (lib) => `[Thư viện ${lib.name}] ${lib.role}: ${lib.whyNeeded}`
        ),
      ],
      techStack: rw.libraries.map((l) => l.name),
      defaultFilePath: rw.ideFiles[0]?.path || 'README.md',
      files: rw.ideFiles,
      interactiveCommands: rw.ideCommands,
    };
  });
