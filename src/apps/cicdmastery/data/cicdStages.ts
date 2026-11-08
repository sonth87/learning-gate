import { CicdStageId, CicdStageMeta } from '../types/cicd.types';

export const CICD_STAGES: CicdStageMeta[] = [
  {
    id: 'cicd-stage-0',
    number: 0,
    title: 'Bản đồ Tổng quan: 6 Công nghệ Trụ cột Hạ tầng',
    subtitle: 'CI/CD, Docker, Redis, RabbitMQ, Kafka & Kubernetes',
    pdfPartLabel: 'Mục 0 (Trang 1)',
    goal: 'Hiểu bức tranh lớn của hệ thống phân tán hiện đại và vai trò "đường ống nhạc trưởng" của CI/CD kết nối mã nguồn với Container, Cache, Message Broker và Cụm điều phối.',
    primaryLevels: ['fundamental'],
    deliverable: 'Bản đồ kiến trúc End-to-End 6 trụ cột từ Git Commit đến K8s Cluster',
  },
  {
    id: 'cicd-stage-1',
    number: 1,
    title: 'Cấp độ 1: Fundamental — Nền tảng Cốt lõi của CI/CD',
    subtitle: 'CI vs. Delivery vs. Deployment, 6 Thực thể Chuẩn, Git Branching & Full Flow #1',
    pdfPartLabel: 'Phần I — Cấp độ 1 (Trang 2–5)',
    goal: 'Phân biệt chính xác 3 cấp độ tự động hóa (CI / Continuous Delivery / Continuous Deployment), nắm vững 6 thành phần cốt lõi (Trigger, Pipeline, Stage, Job, Step, Runner), chiến lược phân nhánh Git và xây dựng Lean Pipeline thực tế.',
    primaryLevels: ['fundamental', 'basic'],
    deliverable: 'Full Flow #1: .github/workflows/lean-ci-cd.yml với Service Containers (Postgres 16 + Redis 7) & Smoke Test',
  },
  {
    id: 'cicd-stage-2',
    number: 2,
    title: 'Cấp độ 2: Intermediate — Tối ưu hóa, DevSecOps & OIDC',
    subtitle: 'Cache vs. Artifact, Đồ thị DAG, Test Sharding, 5 Lớp Bảo mật Shift-Left & OIDC',
    pdfPartLabel: 'Phần I — Cấp độ 2 (Trang 5–8)',
    goal: 'Xử lý bài toán nghẽn hiệu năng bằng Cache pull-push/pull, DAG (needs) và Test Sharding (parallel: 4); tích hợp 5 lớp bảo mật DevSecOps (Gitleaks, Semgrep, Trivy, ZAP) và xác thực Cloud không mật khẩu qua OIDC Federation.',
    primaryLevels: ['basic', 'advanced'],
    deliverable: 'Full Flow #2: .gitlab-ci.yml 5 giai đoạn + DAG + Trivy Scan + Manual Approval Gate',
  },
  {
    id: 'cicd-stage-3',
    number: 3,
    title: 'Cấp độ 3: Advanced — Zero-Downtime, GitOps & Quy mô lớn',
    subtitle: 'Blue-Green vs. Canary, GitOps (ArgoCD Pull), Monorepo, Expand-and-Contract DB & DORA',
    pdfPartLabel: 'Phần I — Cấp độ 3 (Trang 8–10)',
    goal: 'Làm chủ 5 chiến lược triển khai không gián đoạn (Recreate, Rolling, Blue-Green, Canary, Shadow), kiến trúc GitOps Pull-based với ArgoCD, tối ưu Monorepo (Affected-Only), 3 pha Database Migration tương thích ngược và 4 chỉ số DORA.',
    primaryLevels: ['advanced', 'pro'],
    deliverable: 'Kiến trúc GitOps Pull-based + Kịch bản Canary Rollout & Expand-and-Contract DB Migration',
  },
  {
    id: 'cicd-stage-4',
    number: 4,
    title: 'Phần Mở rộng: Zero-Downtime 3 Mảnh ghép, Approval Gates & AI Review',
    subtitle: 'Dockerfile dumb-init + Express SIGTERM + K8s preStop, CODEOWNERS & CodeRabbit/PR-Agent',
    pdfPartLabel: 'Phần Mở rộng (Trang 10–16)',
    goal: 'Phối hợp nhịp nhàng 3 tầng (Docker Exec Form + Backend Graceful Shutdown + K8s Readiness/preStop) để đạt 0% lỗi 502 Bad Gateway; thiết kế 3 chốt phê duyệt doanh nghiệp và tích hợp AI Reviewer tự động.',
    primaryLevels: ['pro', 'master'],
    deliverable: 'Full Flow #3 (Bộ 3 mảnh ghép Zero-Downtime) & Full Flow #4 (.coderabbit.yaml + Self-Hosted Qodo PR-Agent)',
  },
  {
    id: 'cicd-stage-5',
    number: 5,
    title: 'Phần II: Tình huống Thực chiến & Xử lý Sự cố Vận hành (A1–A3 & B1–B7)',
    subtitle: 'DinD vs. Kaniko, Tối ưu Pipeline 42p → 4p, Chống Race Condition, Lộ Secret & Flaky Tests',
    pdfPartLabel: 'Phần II — Practical Scenarios (Trang 16–21)',
    goal: 'Giải quyết 10 bài toán kiến trúc & sự cố thực tế hóc búa nhất: chọn Delivery vs Deployment, đóng gói Docker an toàn trong K8s Runner, cứu hộ Pipeline 42 phút, khóa Concurrency chống ghi đè, xử lý lộ AWS Key, trị dứt điểm Flaky Tests và lỗi Works on Local / Fails on CI.',
    primaryLevels: ['pro', 'master'],
    deliverable: '10 Runbook Chẩn đoán & Khắc phục Sự cố CI/CD Cấp độ Production',
  },
];

export const CICD_STAGE_MAP: Record<CicdStageId, CicdStageMeta> = Object.fromEntries(
  CICD_STAGES.map((s) => [s.id, s])
) as Record<CicdStageId, CicdStageMeta>;
