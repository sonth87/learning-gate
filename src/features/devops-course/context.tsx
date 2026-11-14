import React, { createContext, useContext } from 'react';
import type { DevOpsAccent, DevOpsCourseId, RelatedToolLink } from './types';

export interface CourseMeta {
  courseId: DevOpsCourseId;
  accent: DevOpsAccent;
  appTitle: string;
  welcomeTitle: string;
  readingsTitle: string;
  readingsSubtitle: string;
  stepSteps: [string, string, string, string, string];
  onOpenRelatedTool?: (link: RelatedToolLink) => void;
}

export const COURSE_META: Record<DevOpsCourseId, Omit<CourseMeta, 'onOpenRelatedTool'>> = {
  kube: {
    courseId: 'kube',
    accent: 'sky',
    appTitle: 'Docker & K8s Mastery',
    welcomeTitle: 'Chào mừng đến với Docker & K8s Mastery 👋',
    readingsTitle: 'Đọc cấu hình thật: Dockerfile, Compose & K8s Manifests',
    readingsSubtitle:
      'Tuyển tập cấu hình thực tế (mẫu chuẩn, cấu hình lỗi, so sánh, API cũ & lỗ hổng bảo mật) kèm nhiệm vụ phân tích.',
    stepSteps: [
      'Đọc lesson (ánh xạ từ Node.js/npm)',
      'Làm quiz (cần ≥ 70%)',
      'Làm bài thực hành — chấm bằng AST / Terminal thật',
      'Đọc cấu hình thật & tìm lỗi',
      'Ôn flashcard SRS & câu sai mỗi ngày',
    ],
  },
  cicd: {
    courseId: 'cicd',
    accent: 'cyan',
    appTitle: 'CI/CD Architecture',
    welcomeTitle: 'Chào mừng đến với CI/CD Architecture 👋',
    readingsTitle: 'Đọc cấu hình thật: GitHub Actions, GitLab CI & GitOps',
    readingsSubtitle:
      'Kho workflow và cấu hình đường ống thực tế (chuẩn mực, bẫy race condition, lỗi bảo mật & cú pháp cũ) kèm câu hỏi nhiệm vụ.',
    stepSteps: [
      'Đọc lesson (ánh xạ từ npm scripts)',
      'Làm quiz (cần ≥ 70%)',
      'Làm bài thực hành — chấm cấu trúc YAML / trạng thái thật',
      'Đọc workflow thật & phân tích',
      'Ôn flashcard SRS & câu sai mỗi ngày',
    ],
  },
  redis: {
    courseId: 'redis',
    accent: 'rose',
    appTitle: 'Redis Mastery',
    welcomeTitle: 'Chào mừng đến với Redis Mastery',
    readingsTitle: 'Đọc cấu hình thật: redis.conf, Lua Scripts, Streams & Cluster',
    readingsSubtitle:
      'Kho cấu hình production, kịch bản Lua nguyên tử, Docker/K8s StatefulSet và các bẫy sự cố thực chiến (Stampede, Bigkey, OOM, Split-Brain).',
    stepSteps: [
      'Đọc lesson trực quan (ánh xạ từ JS Map / Python dict)',
      'Làm quiz kiểm tra tư duy & độ phức tạp Big-O (≥ 70%)',
      'Thực hành trên Redis 8 VM & trình chấm AST redis.conf',
      'Đọc cấu hình thật & chẩn đoán sự cố Production',
      'Ôn flashcard SRS & luyện gõ lệnh chuẩn mỗi ngày',
    ],
  },
};

const Ctx = createContext<CourseMeta>({
  ...COURSE_META.kube,
});

export const CourseProvider: React.FC<{ value: CourseMeta; children: React.ReactNode }> = ({ value, children }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);

export const useCourseMeta = () => useContext(Ctx);
