import React from 'react';
import { ArrowLeft, CheckCircle2, ExternalLink, Layers, ListChecks, Play, SkipForward, Undo2 } from 'lucide-react';
import { sdAttributionLine } from '../credits';
import { useSdCurriculum } from '../data';
import { isModuleSkipped, lessonRead, quizBest, sdModuleProgress } from '../logic';
import { useSdNav, useSdProgress } from '../store';
import { CourseBar, CourseBtn } from '@/features/devops-course/components/CourseUi';
import { Callout, Card, Pill, Spinner } from '@/features/workpath/components/ui';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';

/** Trang tổng quan một bài: mục tiêu, tiến độ, nguồn và lối vào bàn học / quiz / flashcard. */
export const SdModuleView: React.FC<{ id: string }> = ({ id }) => {
  const { data: cur } = useSdCurriculum();
  const s = useSdProgress((x) => x.state);
  const toggleSkipModule = useSdProgress((x) => x.toggleSkipModule);
  const markLessonRead = useSdProgress((x) => x.markLessonRead);
  const { go, back } = useSdNav();
  const setCourseCursor = useWorkbenchStore((x) => x.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((x) => x.setExpandedLevel);

  if (!cur) return <Spinner />;
  const mod = cur.modules.find((m) => m.id === id);
  if (!mod) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Callout tone="warn">Không tìm thấy bài {id}.</Callout>
        <CourseBtn accent="cyan" className="mt-4" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </CourseBtn>
      </div>
    );
  }

  const [d, t] = sdModuleProgress(s, mod, cur.passQuiz);
  const skipped = isModuleSkipped(s, mod.id);
  const read = lessonRead(s, mod.id);
  const best = quizBest(s, mod.id);
  const levelTitle = cur.levels[String(mod.level)];

  const openWorkbench = () => {
    setCourseCursor('sdmastery', mod.id, 0);
    setExpandedLevel('sdmastery', mod.level);
    go({ name: 'workbench' });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 text-[var(--dts-ink)] sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <CourseBtn accent="cyan" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </CourseBtn>
        <span className="font-mono text-sm font-extrabold text-cyan-400">{mod.id}</span>
        <Pill tone="info">Cấp {mod.level}</Pill>
        <Pill>{mod.difficulty}</Pill>
        <Pill>{mod.durationMin} phút</Pill>
        {skipped ? <Pill tone="info">đã bỏ qua</Pill> : d === t ? <Pill tone="ok">hoàn thành</Pill> : null}
      </div>

      <div>
        <h1 className="text-2xl font-extrabold leading-snug text-white">{mod.title}</h1>
        {levelTitle && <p className="mt-1 text-xs text-slate-400">Cấp {mod.level} · {levelTitle}</p>}
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{mod.summary}</p>
        <CourseBar value={t ? d / t : 0} accent="cyan" className="mt-3 max-w-sm" />
      </div>

      <Card>
        <h2 className="mb-2 text-base font-semibold text-white">Mục tiêu bài học</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {mod.objectives.map((o, i) => (
            <li key={i}>{o.vi}</li>
          ))}
        </ul>
      </Card>

      {(() => {
        const attr = sdAttributionLine(mod);
        if (!attr) return null;
        return (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span>{attr.text.vi}</span>
              <a
                href={attr.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
              >
                <span>Mở trên systemdesigncore.site</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          </Card>
        );
      })()}

      <div className="flex flex-wrap gap-2">
        <CourseBtn variant="primary" accent="cyan" onClick={openWorkbench}>
          <Play className="h-4 w-4" /> Học trong bàn học
        </CourseBtn>
        {mod.quiz.length > 0 && (
          <CourseBtn accent="cyan" onClick={() => go({ name: 'quiz', mode: 'module', moduleId: mod.id })}>
            <ListChecks className="h-4 w-4" /> Quiz ({mod.quiz.length} câu{best ? ` · tốt nhất ${Math.round(best * 100)}%` : ''})
          </CourseBtn>
        )}
        {mod.cards.length > 0 && (
          <CourseBtn accent="cyan" onClick={() => go({ name: 'flash', moduleId: mod.id })}>
            <Layers className="h-4 w-4" /> Flashcard ({mod.cards.length})
          </CourseBtn>
        )}
        {!read && !skipped && (
          <CourseBtn accent="cyan" onClick={() => markLessonRead(mod.id)}>
            <CheckCircle2 className="h-4 w-4" /> Đánh dấu đã đọc
          </CourseBtn>
        )}
        {(!(d === t) || skipped) && (
          <CourseBtn accent="cyan" onClick={() => toggleSkipModule(mod.id)}>
            {skipped ? (
              <>
                <Undo2 className="h-4 w-4" /> Hoàn tác bỏ qua
              </>
            ) : (
              <>
                <SkipForward className="h-4 w-4" /> Đã biết, bỏ qua bài này
              </>
            )}
          </CourseBtn>
        )}
      </div>
    </div>
  );
};
