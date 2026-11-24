import type { BilingualText, CalloutKind } from '@/components/scale-workbench/types';
import type {
  CuratedStepPayload,
  ModuleCuratedBlueprint,
} from '@/features/devops-course/scale/courseLessonBuilder';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

function pickStepPhase(s: number, total: number): 'first' | 'mid1' | 'mid2' | 'last' {
  if (s <= 0) return 'first';
  if (s >= Math.max(1, total - 1)) return 'last';
  return s === 1 ? 'mid1' : 'mid2';
}

function makeStepCallout(
  s: number,
  total: number,
  firstText: BilingualText,
  mid1Text: BilingualText,
  mid2Text: BilingualText,
  lastText: BilingualText
): NonNullable<CuratedStepPayload['callout']> {
  const phase = pickStepPhase(s, total);
  const kind: CalloutKind =
    phase === 'first'
      ? 'key-idea'
      : phase === 'last'
        ? 'good-to-know'
        : 'watch-out';
  const title =
    phase === 'first'
      ? bi('Khái niệm cốt lõi & Bối cảnh áp dụng', 'Core Concept & Practical Context')
      : phase === 'last'
        ? bi('Nguyên tắc áp dụng khi giải đề', 'Key Exam Decision Principle')
        : bi('Cơ chế PMI & Sai lầm cần tránh', 'PMI Mechanism & Common Pitfall');
  const text =
    phase === 'first'
      ? firstText
      : phase === 'mid1'
        ? mid1Text
        : phase === 'mid2'
          ? mid2Text
          : lastText;
  return { kind, title, text };
}

export const PMP_LEVEL_TITLES: Record<number, BilingualText> = {
  0: bi('Cấu trúc Đề thi ECO 2026 & Tư duy PMI', 'Exam Blueprint & PMI Core Mindset'),
  1: bi('6 Nguyên tắc Quản trị theo PMBOK® 8', '6 PMBOK® 8 Action Principles'),
  2: bi('Predictive, Agile, Scrum, Kanban & Hybrid', 'Predictive, Agile, Scrum, Kanban & Hybrid'),
  3: bi('Ra Quyết định trên 7 Performance Domains', '7 Performance Domains Decision-Making'),
  4: bi('Chiến thuật Phân tích Câu hỏi & Đáp án Nhiễu', 'Situational Question Analysis & Distractors'),
  5: bi('Business Environment (Compliance · ADKAR · AI)', 'Compliance, ADKAR, AI & Exam Strategy'),
};

export const PMP_BLUEPRINTS: Record<string, ModuleCuratedBlueprint> = {
  P00: {
    id: 'P00',
    titleEn: 'Decoding the PMP Exam (ECO 07/2026) & PMBOK® 8 Map',
    subtitleEn:
      'Translate PMI acronyms (ECO, PMBOK 8, OCM, ESG) into plain language and map the 33% / 41% / 26% blueprint.',
    durationMin: 16,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Nắm vững khái niệm nền tảng: ECO (Khung đề cương thi), PMBOK® 8 (Bộ quy chuẩn QLDA), OCM và ESG',
        'Understand ECO (Exam Syllabus), PMBOK® 8 (Reference Standard), OCM, and ESG clearly'
      ),
      bi(
        'Nắm chắc cấu trúc 180 câu / 240 phút và sự gia tăng tỷ trọng miền Business Environment từ 8% lên 26%',
        'Master the 180-question / 240-minute format and Business Environment weight increase from 8% to 26%'
      ),
      bi(
        'Kết nối kiến trúc 3 tầng PMBOK 8 (6 Nguyên tắc → 5 Focus Areas → 7 Domains) sang 14 chủ đề PMP Mindmap',
        'Map PMBOK 8’s 6 Principles -> 5 Focus Areas -> 7 Performance Domains to the 14 Mindmap topics'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('CẤU TRÚC ĐỀ THI', 'EXAM FORMAT'),
            value: bi('180 câu / 240 phút', '180 Qs / 240 mins'),
            tone: 'ok',
          },
          {
            label: bi('TỶ TRỌNG ECO 2026', 'ECO 2026 WEIGHTS'),
            value: bi('People 33 · Proc 41 · Biz 26%', 'People 33 · Proc 41 · Biz 26%'),
            tone: phase === 'mid1' ? 'warn' : 'ok',
          },
          {
            label: bi('CHUẨN THAM CHIẾU', 'STANDARD'),
            value: bi('PMBOK® 8 (6P · 5FA · 7PD)', 'PMBOK® 8 (6P · 5FA · 7PD)'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Phân tách rõ ECO (đề cương câu hỏi thi) với PMBOK® Guide 8 (khung kiến trúc nguyên tắc & quy trình)',
                    'Clarified ECO (exam syllabus) vs PMBOK® Guide 8 (reference architecture)'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Miền Business Environment (Compliance, OCM, Benefits, ESG, AI) tăng gấp hơn 3 lần từ 8% lên 26% tổng điểm',
                      'Business Environment domain increased more than 3× from 8% to 26% of exam weight'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '~',
                      text: bi(
                        'Hợp nhất 10 Knowledge Areas cũ thành 7 Performance Domains hiện đại gắn với 6 Nguyên tắc PMBOK 8',
                        'Consolidated 10 legacy Knowledge Areas into 7 integrated PMBOK 8 Performance Domains'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Kết nối đồng bộ 3 miền People · Process · Business Environment trong từng tình huống thực chiến',
                        'Unified People, Process, and Business Environment lenses for situational questions'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'ECO 07/2026 là khung đề cương quy định các nhiệm vụ được kiểm tra và tỷ trọng điểm, còn PMBOK® Guide 8 là tài liệu quy chuẩn kiến thức tham chiếu. Có thể hình dung giống như mối quan hệ giữa đề cương ôn thi và giáo trình chuẩn mực.',
            'ECO 07/2026 is the official exam syllabus specifying tested tasks and weights, while PMBOK® Guide 8 is the reference standard manual.'
          ),
          bi(
            'Không học thuộc lòng danh sách đầu vào/đầu ra (ITTO) hay xem nhẹ Business Environment: hơn 90% đề thi hỏi hành động FIRST / NEXT / BEST và riêng Business Environment chiếm 26% điểm.',
            'Never cram raw ITTO lists or ignore Business Environment — 90%+ of questions test situational FIRST/NEXT/BEST judgment, with 26% in Business Environment.'
          ),
          bi(
            'Lưu ý thường gặp: Agile không xóa bỏ 5 Focus Areas (Initiating → Closing). Thực tế cả 5 nhóm trọng tâm này vẫn vận hành đầy đủ theo chu kỳ ngắn trong từng Sprint.',
            'Common misconception: Agile does not eliminate Initiating -> Closing. In PMBOK 8, all 5 Focus Areas cycle continuously inside every short Sprint.'
          ),
          bi(
            'Nguyên tắc ôn tập: Mỗi câu hỏi tình huống thường lồng ghép Con người + Quy trình + Giá trị kinh doanh. Hãy đọc câu chốt cuối cùng trước và giữ nhịp ~80 giây/câu.',
            'Key Principle: Read the final question sentence first, identify Agile/Predictive/Hybrid cues, and pace yourself at ~80 seconds per question.'
          )
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            ' Bản đồ Khung Đề thi PMP® ECO 07/2026 & Kiến trúc PMBOK® 8',
            'PMP® ECO 07/2026 Blueprint & PMBOK® 8 Architecture'
          ),
          subtitle: bi(
            '180 câu / 240 phút · Mọi câu tình huống đều kết hợp Con người + Quy trình + Môi trường kinh doanh',
            '180 questions / 240 mins · Situational judgment integrating People, Process & Business Environment'
          ),
          cells: [
            'People (33%)',
            'Process (41%)',
            'Biz Env (26%)',
            'PMBOK 8 (6P·7PD)',
          ],
          activeIndices:
            phase === 'first'
              ? [0, 1]
              : phase === 'mid1'
                ? [2]
                : phase === 'mid2'
                  ? [3]
                  : [0, 1, 2, 3],
          pointers:
            phase === 'first'
              ? [{ index: 1, label: 'Cốt lõi vận hành', tone: 'blue' }]
              : phase === 'mid1'
                ? [{ index: 2, label: 'Tăng 8% → 26%!', tone: 'orange' }]
                : phase === 'mid2'
                  ? [{ index: 3, label: '6 Nguyên tắc + 7 Domains', tone: 'purple' }]
                  : [{ index: 2, label: '180 câu tích hợp', tone: 'green' }],
          outputPill: {
            label: bi('Nhịp phòng thi', 'Target Pace'),
            value: bi('~80 giây / câu · 0 trừ điểm câu sai', '~80s / question · No guessing penalty'),
            tone: 'green',
          },
        },
        defaultCode: `[PMP® ECO 07/2026 & PMBOK® 8 QUICK MAP]\n• ECO 07/2026  : People 33% (8 tasks) | Process 41% (10 tasks) | Business Env 26% (8 tasks)\n• PMBOK® 8     : 6 Guiding Principles -> 5 Focus Areas -> 7 Performance Domains (40 Processes)\n• Exam Format  : 180 Questions (175 scored + 5 pretest) / 240 mins (~80s/question)`,
      };
    },
  },

  P01: {
    id: 'P01',
    titleEn: 'From Real-World Firefighting to PMI’s 6 Golden Reflexes',
    subtitleEn:
      'Unlearn impulsive escalation, hero-coding, and firing team members — adopt Verify → Assess → Collaborate → Govern.',
    durationMin: 16,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Hiểu vai trò của Sponsor, Project Charter, Baseline & CCB để thấy vì sao thói quen xử lý cảm tính ngoài thực tế dễ gây mất điểm PMP',
        'Understand Sponsor, Charter, Baseline & CCB roles and why ad-hoc shortcuts fail on the PMP exam'
      ),
      bi(
        'Chuyển đổi 6 thói quen cảm tính sang 6 nguyên tắc hành động chuẩn PMI: Phân tích trước → Hợp tác trực tiếp → Tuân thủ quy trình',
        'Flip 6 reactive real-world habits into PMI’s 6 disciplined principles: Verify -> Assess -> Collaborate -> Govern'
      ),
      bi(
        'Nắm rõ 3 ngoại lệ duy nhất PM được phép leo thang (Escalate) vấn đề lên Project Sponsor',
        'Know the exact 3 exceptions where escalating to the Project Sponsor is valid'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('HÀNH ĐỘNG ĐẦU TIÊN', 'FIRST ACTION'),
            value: bi('Verify & Assess Impact', 'Verify & Assess Impact'),
            tone: 'ok',
          },
          {
            label: bi('LEO THANG SPONSOR', 'ESCALATE TO SPONSOR'),
            value: bi('Chỉ khi vượt thẩm quyền PM!', 'Only beyond PM authority!'),
            tone: phase === 'last' ? 'ok' : 'warn',
          },
          {
            label: bi('SA THẢI / LÀM THAY', 'FIRE / HERO-CODE'),
            value: bi('Loại ngay 99% đáp án!', 'Eliminate 99% of time!'),
            tone: 'bad',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '-',
                  text: bi(
                    'Nhận diện các thói quen xử lý cảm tính: tự ý sửa code không qua kiểm soát, làm thay việc của nhóm, báo cáo thẳng lên cấp trên khi chưa phân tích',
                    'Identified real-world firefighting traps: stealth code edits, hero coding, premature escalation'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Thay thế 6 phản ứng cảm tính bằng 6 nguyên tắc kỷ luật của Servant & Accountable Leader',
                      'Replaced 6 impulsive shortcuts with PMI’s 6 disciplined leadership principles'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Áp dụng quy trình 4 bước cho câu hỏi FIRST/NEXT: Kiểm chứng → Đánh giá tác động → Họp 1-1 → Qua CCB/PO',
                        'Installed 4-step FIRST/NEXT sequence: Verify -> Assess -> Collaborate -> Govern'
                      ),
                    },
                  ]
                : [
                    {
                      op: '~',
                      text: bi(
                        'Chỉ leo thang lên Sponsor khi vượt trần Baseline/Management Reserve hoặc thay đổi Business Case (kèm phương án đề xuất)',
                        'Restricted Sponsor escalation strictly to Charter/Business Case boundaries with concrete options'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Ở quy mô nhỏ, tự ý sửa nhanh giúp khách hàng có thể được xem là linh hoạt; nhưng trong quản trị dự án chuẩn PMI, mọi thay đổi chưa qua đánh giá tác động đều tiềm ẩn rủi ro dây chuyền về bảo mật, tiến độ và hợp đồng.',
            'In small startups, stealth 2-hour fixes look helpful; in enterprise PMI governance, unassessed changes trigger cascading cost, security, and legal failures.'
          ),
          bi(
            'Lưu ý quan trọng: Các phương án có nội dung "Ask HR to replace the developer", "Immediately pause the project", hoặc "Take over the technical task yourself" hầu như luôn sai.',
            'Top exam trap: Choices saying "Replace the team member", "Halt the project", or "Do the technical task yourself" are almost always wrong.'
          ),
          bi(
            'Khi gặp câu hỏi "What should the PM do FIRST?", không nhảy thẳng sang nộp Change Request — luôn kiểm chứng thông tin và phân tích tác động cùng nhóm trước.',
            'On "do FIRST" questions, never jump straight to submitting a Change Request — verify facts and assess impact with the team first.'
          ),
          bi(
            'Nguyên tắc xử lý: Trước khi báo cáo vấn đề vượt thẩm quyền lên Sponsor, PM phải hoàn tất phân tích dữ liệu và chuẩn bị sẵn các phương án kèm khuyến nghị cụ thể.',
            'Key Principle: Never bring an empty problem to the Sponsor — complete impact analysis first and present actionable options with a recommendation.'
          )
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Chuỗi 4 Bước Phản xạ Chuẩn PMI Cho Câu Hỏi FIRST / NEXT',
            'PMI 4-Step Decision Sequence for FIRST / NEXT Questions'
          ),
          subtitle: bi(
            'Loại ngay đáp án sa thải / tự code thay / leo thang Sponsor khi chưa phân tích tác động',
            'Eliminate firing, hero-coding, or escalating to Sponsor before impact analysis'
          ),
          cells: [
            '1. Verify Facts',
            '2. Assess Impact',
            '3. Meet Team 1-1',
            '4. CCB / Backlog',
          ],
          activeIndices:
            phase === 'first'
              ? [0]
              : phase === 'mid1'
                ? [0, 1]
                : phase === 'mid2'
                  ? [0, 1, 2]
                  : [0, 1, 2, 3],
          pointers:
            phase === 'first'
              ? [{ index: 0, label: 'Đọc log / kế hoạch gốc', tone: 'blue' }]
              : phase === 'mid1'
                ? [{ index: 1, label: 'Đánh giá toàn diện', tone: 'green' }]
                : phase === 'mid2'
                  ? [{ index: 2, label: 'Hợp tác giải gốc rễ', tone: 'purple' }]
                  : [{ index: 3, label: 'Quản trị đúng luồng', tone: 'orange' }],
          outputPill: {
            label: bi('Ngoại lệ Sponsor', 'Sponsor Escalation'),
            value: bi('Chỉ khi vượt trần Charter / Business Case (kèm phương án!)', 'Only beyond Charter / Business Case with options!'),
            tone: 'yellow',
          },
        },
        defaultCode: `[4-STEP PMI REFLEX FOR "FIRST / NEXT" QUESTIONS]\n1. VERIFY      : Check facts at the source (Plan / Charter / Contract / Logs).\n2. ASSESS      : Analyze holistic impact with the team (Scope, Time, Cost, Risk, Value).\n3. COLLABORATE : Meet face-to-face (1-on-1 / Workshop) to solve root causes.\n4. GOVERN      : Route Baseline changes via CCB (Predictive) or Backlog via PO (Agile).`,
      };
    },
  },

  P02: {
    id: 'P02',
    titleEn: 'Holistic Systems View, Value Focus & Sustainability (PMBOK 8 #1 · #2 · #5)',
    subtitleEn:
      'Separate Output from Outcome & Benefits, contrast MVP vs MMF, and overcome Sunk Cost Fallacy.',
    durationMin: 16,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Phân biệt 3 cấp độ giá trị dự án: Output (sản phẩm bàn giao), Outcome (hành vi sử dụng thực tế) và Benefits (lợi ích kinh doanh ròng)',
        'Distinguish Deliverable Output from Behavioral Outcome and Business Benefits via software examples'
      ),
      bi(
        'Phân biệt rõ MVP (bản thử nghiệm nhỏ nhất để kiểm chứng giả thuyết) với MMF (tính năng nhỏ nhất đủ tạo giá trị thương mại)',
        'Contrast MVP (minimum experiment for learning) vs MMF (minimum feature for real market value)'
      ),
      bi(
        'Áp dụng Tư duy Hệ thống (Holistic View), Phát triển Bền vững (ESG) và loại bỏ ngụy biện Chi phí chìm (Sunk Cost)',
        'Apply Holistic Systems Thinking, ESG Sustainability, and reject the Sunk Cost Fallacy'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('THƯỚC ĐO THÀNH CÔNG', 'TRUE SUCCESS'),
            value: bi('Outcome & Benefits ≠ Output', 'Outcome & Benefits ≠ Output'),
            tone: 'ok',
          },
          {
            label: bi('MVP VS MMF', 'SLICE PURPOSE'),
            value: bi('MVP = Học · MMF = Giá trị', 'MVP = Learn · MMF = Earn'),
            tone: 'ok',
          },
          {
            label: bi('CHI PHÍ ĐÃ TIÊU', 'SUNK COST RULE'),
            value: bi('Không cứu dự án vô giá trị!', 'Ignore sunk cost in decisions!'),
            tone: phase === 'last' ? 'warn' : 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Đo thành công dự án đến tận bước người dùng đón nhận (Outcome) và lợi ích kinh doanh ròng (Benefits / NPV)',
                    'Extended project success definition from technical Output to user Outcome & net Benefits'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Tách rõ lát cắt MVP để học hỏi phản hồi sớm và lát cắt MMF để thu giá trị thương mại tức thì',
                      'Distinguished hypothesis-testing MVP from value-generating MMF'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Nhúng chuẩn mực ESG / Bền vững vào cả cách vận hành dự án lẫn vòng đời sản phẩm sau bàn giao',
                        'Embedded Holistic Impact Assessment and dual-dimension ESG Sustainability'
                      ),
                    },
                  ]
                : [
                    {
                      op: '-',
                      text: bi(
                        'Loại bỏ ngụy biện Chi phí chìm ("đã tiêu 80% ngân sách nên ráng làm nốt") khi Business Case đã gãy',
                        'Eliminated Sunk Cost Fallacy when market shifts invalidate the Business Case'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Output là sản phẩm kỹ thuật bàn giao đúng hạn, Outcome là sự thay đổi hành vi sử dụng của người dùng, còn Benefits là lợi ích kinh doanh thu về. Ví dụ trong dự án App đặt lịch khám: bàn giao App là Output, 70% bệnh nhân đặt lịch qua App là Outcome, tăng 25% công suất bệnh viện là Benefits.',
            'Output is the delivered technical product, Outcome is user behavior adoption, and Benefits are measurable business gains (e.g., shipping the booking app -> 70% patient adoption -> 25% higher clinic throughput).'
          ),
          bi(
            'Cách phân biệt trong đề thi: Khi đề hỏi "kiểm chứng xem khách hàng có quan tâm ý tưởng mới không" → chọn MVP. Khi đề hỏi "phát hành cụm tính năng nhỏ nhất tạo doanh thu ngay" → chọn MMF.',
            'Exam distinction: Testing a risky market hypothesis -> pick MVP. Releasing the smallest complete feature that earns value -> pick MMF.'
          ),
          bi(
            'Mọi điều chỉnh cục bộ (như rút ngắn 1 tuần kiểm thử) đều tạo tác động dây chuyền sang Rủi ro, Chất lượng và Chi phí bảo trì — luôn thực hiện đánh giá tác động toàn diện (Holistic View).',
            'Every local shortcut triggers system-wide ripple effects across Quality, Risk, and lifecycle ops — always run a Holistic Impact Assessment.'
          ),
          bi(
            'Nguyên tắc xử lý Sunk Cost: Dù dự án đã chi 85% ngân sách, nếu sản phẩm không còn tạo ra Benefits khả thi, PM phải rà soát Business Case và báo cáo Sponsor xem xét Pivot hoặc dừng dự án.',
            'Key Principle: Past spending is a Sunk Cost. If Business Case value vanishes, reassess with the Sponsor to pivot or formally terminate.'
          )
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Chuỗi Chuyển hóa Giá trị: Output → Outcome → Net Benefits & ESG',
            'Value Realization Chain: Output → Outcome → Net Benefits & ESG'
          ),
          subtitle: bi(
            'MVP = Thử nghiệm nhỏ nhất để kiểm chứng giả thuyết · MMF = Tính năng nhỏ nhất đủ tạo giá trị thực',
            'MVP = Smallest experiment to validate hypothesis · MMF = Smallest marketable feature set'
          ),
          cells: [
            'MVP (Học sớm)',
            'Output (Bàn giao)',
            'Outcome (Đón nhận)',
            'Benefits & ESG',
          ],
          activeIndices:
            phase === 'first'
              ? [1, 2, 3]
              : phase === 'mid1'
                ? [0, 1]
                : phase === 'mid2'
                  ? [2, 3]
                  : [3],
          pointers:
            phase === 'first'
              ? [{ index: 2, label: 'Thay đổi hành vi user', tone: 'purple' }]
              : phase === 'mid1'
                ? [{ index: 0, label: 'Kiểm chứng giả thuyết', tone: 'blue' }]
                : phase === 'mid2'
                  ? [{ index: 3, label: 'Holistic & ESG', tone: 'green' }]
                  : [{ index: 3, label: 'Bỏ qua Sunk Cost!', tone: 'orange' }],
          outputPill: {
            label: bi('Quy tắc Sunk Cost', 'Sunk Cost Rule'),
            value: bi('Chi phí đã tiêu không tính vào quyết định tương lai', 'Past spend never justifies continuing a broken Business Case'),
            tone: 'green',
          },
        },
        defaultCode: `[VALUE DELIVERY CHAIN & SLICE SELECTION]\n• Output (Deliverable) -> Outcome (Behavior Shift) -> Benefits (Net ROI / NPV / ESG)\n• MVP = Smallest experiment to VALIDATE HYPOTHESIS & learn fast\n• MMF = Smallest complete feature set to DELIVER REAL MARKET VALUE`,
      };
    },
  },

  P03: {
    id: 'P03',
    titleEn: 'Accountable Leadership, Empowerment & Built-In Quality (#3 · #4 · #6)',
    subtitleEn:
      'Foster psychological safety to stop "Watermelon Reports", distinguish Quality vs Grade, and prevent defects early.',
    durationMin: 15,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Hiểu rõ An toàn tâm lý (Psychological Safety), tính minh bạch báo cáo trạng thái (tránh "báo cáo dưa hấu") và phân biệt Quality vs Grade',
        'Understand Psychological Safety, transparent status reporting (avoiding Watermelon Reports), and Quality vs Grade'
      ),
      bi(
        'Áp dụng quy luật Chi phí Chất lượng (CoQ): phòng ngừa trong quy trình luôn tiết kiệm hơn nhiều lần so với sửa lỗi lọt ra khách hàng',
        'Apply Cost of Quality (CoQ): prevention inside the process saves 10–100× over external failures'
      ),
      bi(
        'Giữ vững đạo đức chính trực PMI và xây dựng văn hoá trao quyền tự tổ chức (Empowered Culture)',
        'Uphold PMI ethical honesty and build a blameless, self-organizing team culture'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('QUALITY VS GRADE', 'QUALITY VS GRADE'),
            value: bi('Hạ Grade OK · Cấm hạ Quality!', 'Low Grade OK · Never Low Quality!'),
            tone: 'ok',
          },
          {
            label: bi('CHẤT LƯỢNG NỘI TẠI', 'BUILT-IN QUALITY'),
            value: bi('Phòng ngừa ($1) vs Lỗi ngoài ($500)', 'Prevention ($1) vs Prod Bug ($500)'),
            tone: 'ok',
          },
          {
            label: bi('VĂN HOÁ ĐỘI NGŨ', 'TEAM CULTURE'),
            value: bi('An toàn tâm lý · Tự tổ chức', 'Psychological Safety · Empowered'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Xây dựng An toàn tâm lý để thành viên báo cáo rủi ro sớm, đảm bảo tính minh bạch thực trạng thay vì che giấu vấn đề',
                    'Built Psychological Safety for early risk reporting and eliminated hidden-red status reports'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Đầu tư Chi phí Tuân thủ (CI/CD, Peer Review, chuẩn DoD) ngăn lỗi lọt ra Production gây thiệt hại gấp 100×',
                      'Shifted investment into Cost of Conformance (Prevention & Appraisal) over External Failure'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Giữ chuẩn chính trực dữ liệu tuyệt đối & khai báo ngay xung đột lợi ích theo Quy tắc Đạo đức PMI',
                        'Enforced transparent status reporting and Conflict-of-Interest disclosure'
                      ),
                    },
                  ]
                : [
                    {
                      op: '-',
                      text: bi(
                        'Xoá bỏ quản lý vi mô (Micromanagement) và họp đổ lỗi, chuyển sang Blameless Retrospective & trao quyền',
                        'Replaced micromanagement and blame games with self-organization and blameless learning'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Quality là mức độ sản phẩm đáp ứng đúng yêu cầu cam kết và ít lỗi; Grade là mức độ phong phú tính năng cao cấp. Ví dụ, ứng dụng ít tính năng (Low Grade) nhưng ổn định không lỗi (High Quality) là đạt chuẩn, còn ứng dụng nhiều tính năng (High Grade) nhưng hay lỗi (Low Quality) là không chấp nhận được.',
            'Quality measures conformance to requirements and reliability; Grade measures feature richness. A simple bug-free app (Low Grade, High Quality) is valid; a feature-packed buggy app (Low Quality) is never acceptable.'
          ),
          bi(
            'Sai lầm cần tránh: Khi gấp tiến độ, phương án gợi ý "tạm bỏ qua kiểm thử tích hợp để kịp giao hàng" luôn sai. Chi phí phòng ngừa luôn thấp hơn nhiều so với sửa lỗi ngoài thị trường.',
            'Common pitfall: "Skip integration testing to hit the launch date" is ALWAYS wrong. External failure is the most destructive Cost of Quality.'
          ),
          bi(
            'Dù cấp trên đề nghị điều chỉnh báo cáo sang trạng thái tích cực để khách hàng yên tâm, PM chính trực phải từ chối làm sai lệch số liệu và báo cáo trung thực kèm phương án xử lý.',
            'Even if pressured by a manager to hide schedule delays, an Accountable Leader must report accurate data transparently alongside recovery options.'
          ),
          bi(
            'Nguyên tắc cốt lõi: Người trực tiếp thực thi hiểu rõ nhất giải pháp kỹ thuật — hãy để nhóm tự ước lượng nỗ lực và dùng Blameless Retrospective để cải tiến quy trình thay vì đổ lỗi cá nhân.',
            'Key Principle: Let practitioners estimate their own work and run Blameless Retrospectives to fix systemic process gaps rather than blaming individuals.'
          )
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Đường cong Chi phí Chất lượng (CoQ): Phát hiện lỗi càng muộn cái giá càng đắt gấp bội!',
            'Cost of Quality (CoQ) Escalation Across Project Lifecycle'
          ),
          subtitle: bi(
            'Nhúng chất lượng vào quy trình từ sớm (Ô 1 & 2) giúp khóa chặt rủi ro lọt lỗi ra khách hàng (Ô 4)',
            'Embedding quality early (Cells 1 & 2) prevents catastrophic External Failure (Cell 4)'
          ),
          cells: [
            '1. Phòng ngừa ($1)',
            '2. Thẩm định sớm ($5)',
            '3. Lỗi nội bộ ($25)',
            '4. Lọt ra Khách ($500!)',
          ],
          activeIndices:
            phase === 'first'
              ? [0]
              : phase === 'mid1'
                ? [0, 1, 3]
                : phase === 'mid2'
                  ? [1, 2]
                  : [0, 1],
          pointers:
            phase === 'mid1'
              ? [
                  { index: 0, label: 'Conformance (Đầu tư ✔)', tone: 'green' },
                  { index: 3, label: 'External Failure (Né xa!)', tone: 'rose' },
                ]
              : [
                  { index: 0, label: 'Built-in Quality + Safety ✔', tone: 'green' },
                  { index: 1, label: 'CI/CD & Peer Review', tone: 'blue' },
                ],
          outputPill: {
            label: bi('NGUYÊN TẮC CỐT LÕI', 'CORE RULE'),
            value:
              phase === 'last'
                ? bi('Trao quyền + Phòng ngừa từ gốc', 'Empowerment + Prevention First')
                : bi('Không thỏa hiệp về Quality', 'Never compromise Quality'),
            tone: 'green',
          },
        },
      };
    },
  },

  P04: {
    id: 'P04',
    titleEn: 'Development Spectrum: Predictive, Iterative, Incremental, Agile & Hybrid',
    subtitleEn:
      'Match Requirements × Technical uncertainty (Stacey Matrix) to the right lifecycle and tailor Hybrid transitions.',
    durationMin: 16,
    difficulty: 'Intermediate',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Phân biệt 5 phương pháp phát triển: Predictive (bàn giao 1 lần), Iterative (lặp hoàn thiện độ đúng), Incremental (chia phần bàn giao sớm), Agile và Hybrid',
        'Contrast Predictive, Iterative (correctness), Incremental (speed), Agile, and Hybrid via real software/hardware cases'
      ),
      bi(
        'Hiểu Tam giác Ràng buộc đảo ngược: Predictive cố định Scope; Agile cố định Time & Cost để tối ưu Scope theo giá trị',
        'Understand the Inverted Triangle of Constraints between Plan-Driven and Adaptive projects'
      ),
      bi(
        'Tùy biến (Tailoring) lộ trình Hybrid an toàn thay vì bắt tổ chức truyền thống chuyển sang 100% Agile ngay lập tức',
        'Tailor pragmatic Hybrid transitions rather than forcing overnight 100% Agile shocks'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('YÊU CẦU RÕ CỨNG', 'CLEAR SCOPE'),
            value: bi('Predictive (Giao 1 lần)', 'Predictive (Single delivery)'),
            tone: 'ok',
          },
          {
            label: bi('ITERATIVE VS INCR', 'KEY CONTRAST'),
            value: bi('Làm ĐÚNG ý vs Giao NHANH', 'Correctness vs Speed'),
            tone: 'ok',
          },
          {
            label: bi('CỨNG + MỀM KẾT HỢP', 'HARDWARE + APP'),
            value: bi('Hybrid (~60% đề PMP)', 'Hybrid (~60% of exam)'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Minh hoạ rõ 5 phương pháp phát triển qua ví dụ Trung tâm dữ liệu, UX Prototype, Web TMĐT và Trạm sạc xe điện',
                    'Anchored all 5 development approaches in concrete hardware/software examples'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '~',
                    text: bi(
                      'Đảo ngược Tam giác Ràng buộc: Agile khóa cố định Sprint Timebox & quy mô đội, linh hoạt phạm vi theo giá trị',
                      'Inverted the constraint triangle: fixed Timebox/Cost with value-prioritized dynamic Scope'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Ánh xạ 5 Focus Areas của PMBOK 8 chạy xuyên suốt cả pha tuần tự lớn (Waterfall) lẫn vòng lặp Sprint (Agile)',
                        'Mapped all 5 PMBOK 8 Focus Areas across both Predictive phases and Agile iterations'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Áp dụng Tailoring & mô hình Hybrid thí điểm (Pilot + Coaching) cho doanh nghiệp truyền thống chuyển đổi số',
                        'Tailored gradual Hybrid pilot + coaching transition for risk-averse organizations'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Iterative tập trung lặp nhiều vòng qua mẫu thử để làm rõ và tối ưu độ chính xác yêu cầu; Incremental chia sản phẩm thành từng phần hoàn chỉnh để đưa vào sử dụng sớm; Agile kết hợp cả hai. Có thể liên hệ như vẽ tranh: Iterative phác thảo rồi tô chi tiết dần cả bức, còn Incremental hoàn thiện dứt điểm từng phần một.',
            'Iterative refines prototypes across cycles for correctness; Incremental delivers usable slices early for speed; Agile combines both (like sketching then refining a full painting vs finishing one section at a time).'
          ),
          bi(
            'Từ khóa phân biệt trong đề thi: Thấy "refine requirements via prototypes" → chọn Iterative. Thấy "deliver usable subset of features quickly" → chọn Incremental.',
            'Keyword distinction: "Feedback on prototypes to clarify uncertain scope" -> Iterative. "Release usable feature slices early" -> Incremental.'
          ),
          bi(
            'Không chọn phương án nói "Agile không cần lập kế hoạch" — Agile lập kế hoạch liên tục ở 5 cấp độ (Vision → Roadmap → Release → Iteration → Daily).',
            'Never pick "Agile skips planning" — Agile plans continuously across Vision, Roadmap, Release, Sprint, and Daily horizons.'
          ),
          bi(
            'Nguyên tắc chuyển đổi phương pháp: Với tổ chức lâu năm quen Waterfall, luôn chọn mô hình Hybrid chuyển tiếp kết hợp dự án thí điểm (Pilot) và huấn luyện (Coaching), loại bỏ phương án chuyển 100% sang Agile tức thì.',
            'Key Principle: When transitioning traditional firms, recommend a Hybrid bridge + Pilot project + Agile Coaching — never an abrupt overnight cutover.'
          )
        ),
        memoryScene: {
          kind: 'refs',
          leftTitle: bi('Bối cảnh & Độ bất định Dự án', 'Project Uncertainty Profile'),
          rightTitle: bi('Phương pháp Tiếp cận Chuẩn PMI', 'Tailored Delivery Approach'),
          names: [
            {
              id: 'a1',
              name: 'Phạm vi rõ 100%, sửa vật lý cực đắt (Hạ tầng/Pháp lý)',
              note:
                phase === 'first'
                  ? bi('Cố định Scope đầu kỳ', 'Fixed upfront Scope')
                  : undefined,
              targetId: 'm1',
            },
            {
              id: 'a2',
              name: 'Yêu cầu biến động nhanh, cần phản hồi & ra mắt từng Sprint',
              note:
                phase === 'mid1'
                  ? bi('Cố định Time & Cost', 'Fixed Time & Cost')
                  : undefined,
              targetId: 'm2',
            },
            {
              id: 'a3',
              name: 'Trạm sạc thông minh (Trụ điện cứng + App đặt lịch mềm)',
              note:
                phase === 'last'
                  ? bi('Ưa chuộng nhất đề PMP!', 'Exam favorite!')
                  : undefined,
              targetId: 'm3',
            },
          ],
          objects: [
            {
              id: 'm1',
              typeTag: 'Predictive',
              value: 'Kế hoạch chi tiết đầu kỳ + CCB',
              fields: ['Bàn giao 1 lần cuối dự án'],
              tone: phase === 'first' ? 'blue' : 'neutral',
            },
            {
              id: 'm2',
              typeTag: 'Agile (Iter + Incr)',
              value: 'Timebox 1–4 tuần · Backlog theo Giá trị',
              fields: ['Vừa lấy phản hồi vừa giao Increment thật'],
              tone: phase === 'mid1' || phase === 'mid2' ? 'green' : 'blue',
            },
            {
              id: 'm3',
              typeTag: 'Hybrid Tailored',
              value: 'Phần cứng Predictive + Phần mềm Agile',
              fields: ['Đồng bộ tại các cột mốc tích hợp chung'],
              tone: phase === 'last' ? 'green' : 'purple',
              badge: phase === 'last' ? bi('Chuẩn thực chiến ✔', 'Best Fit ✔') : undefined,
            },
          ],
        },
      };
    },
  },

  P05: {
    id: 'P05',
    titleEn: 'Agile & Scrum Operations: 3 Roles, 5 Events & DoR · AC · DoD Gates',
    subtitleEn:
      'Protect strict Scrum role boundaries (PO = Value, Devs = Estimation, SM = Coach) and distinguish DoR, AC, and DoD.',
    durationMin: 16,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Nắm vững các khái niệm cốt lõi của Scrum (Product Backlog, Sprint Timebox, T-shaped Team, Impediment) và phân định rõ trách nhiệm 3 vai trò',
        'Master Scrum fundamentals and enforce strict role boundaries across PO, Developers, and Scrum Master'
      ),
      bi(
        'Phân biệt 3 tiêu chuẩn kiểm soát chất lượng: DoR (đủ rõ đầu vào Sprint) → AC (tiêu chí riêng từng Story) → DoD (chuẩn hoàn thành chung)',
        'Distinguish Definition of Ready (entry), Acceptance Criteria (story-specific), and Definition of Done (release-wide)'
      ),
      bi(
        'Nhận diện và điều chỉnh 4 sai lệch vận hành phổ biến trong Daily Scrum, chèn việc giữa Sprint, Sprint Review và Retrospective',
        'Diagnose and fix anti-patterns in Daily Scrum, mid-Sprint interruptions, Review, and Retrospective'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('CHỦ SỞ HỮU GIÁ TRỊ', 'VALUE & BACKLOG'),
            value: bi('Product Owner (PO duy nhất)', 'Product Owner (PO only)'),
            tone: 'ok',
          },
          {
            label: bi('QUYỀN ƯỚC LƯỢNG', 'ESTIMATION OWNER'),
            value: bi('Chỉ Developers thực hiện!', 'Developers ONLY!'),
            tone: 'ok',
          },
          {
            label: bi('3 TIÊU CHUẨN CHẤT LƯỢNG', '3 QUALITY GATES'),
            value: bi('DoR → AC → DoD (100%)', 'DoR → AC → DoD (100%)'),
            tone: phase === 'mid2' ? 'warn' : 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Định nghĩa rõ Backlog, Sprint Timebox, đội T-shaped đa kỹ năng và vai trò gỡ rào cản Impediment',
                    'Defined Product Backlog, Sprint Timebox, T-shaped cross-functional team, and Impediment removal'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '-',
                    text: bi(
                      'Chặn đứng lỗi lấn sân: cấm SM giao task/sắp Backlog, cấm PO ước lượng hộ nhóm, cấm chèn việc ngang Sprint',
                      'Blocked Scrum role-crossing traps across PO, Developers, and Scrum Master'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Đặt 3 trạm kiểm soát: DoR lọc đầu vào Sprint Planning, AC kiểm từng Story, DoD khoá chuẩn Increment xuất xưởng',
                        'Positioned DoR (entry gate), Acceptance Criteria (per-story), and DoD (universal Increment gate)'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Giữ Daily Scrum đúng 15 phút cho Developers, demo phần mềm sống ở Review và cải tiến cách làm ở Retro',
                        'Restored crisp 15m Daily Scrum, working Increment Demo at Review, and process improvement at Retro'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Product Owner quản lý Product Backlog và tối ưu giá trị (What & Why); Developers chịu trách nhiệm thực thi kỹ thuật và ước lượng nỗ lực (How & How much); Scrum Master bảo vệ quy trình và tháo gỡ rào cản. Có thể hình dung như PO xác định mục tiêu, Developers vận hành công việc và Scrum Master dọn trở ngại.',
            'PO owns Product Backlog value prioritization (What/Why); Developers own technical execution and estimation (How/How much); Scrum Master safeguards the process and clears impediments.'
          ),
          bi(
            'Lỗi thẩm quyền thường gặp: Loại bỏ ngay các phương án để "Scrum Master assigns tasks", "PO estimates Story Points", hay "Stakeholder adds an urgent item directly to Developers mid-Sprint".',
            'Common role trap: Eliminate any choice where SM assigns tasks, PO estimates effort, or Stakeholders inject work directly into an active Sprint.'
          ),
          bi(
            'Phân biệt nhanh: DoR = Đủ rõ để đưa vào Sprint; AC = Điều kiện nghiệm thu riêng từng Story; DoD = Tiêu chuẩn chất lượng chung cho mọi Increment (chưa đạt DoD = 0 điểm Velocity, không trình diễn ở Sprint Review).',
            'Quick rule: DoR = Ready to ENTER Sprint; AC = Story-specific functional rules; DoD = Shared release quality bar (unmet DoD = 0 Velocity, no Demo).'
          ),
          bi(
            'Nguyên tắc bảo vệ Sprint: Mọi yêu cầu bổ sung giữa Sprint cần được chuyển qua Product Owner để đánh giá giá trị và đưa vào Product Backlog cho Sprint tiếp theo.',
            'Key Principle: Shield the active Sprint — route mid-Sprint feature requests through the Product Owner for Product Backlog prioritization.'
          )
        ),
        scene: {
          nodes: [
            {
              id: 'po',
              shape: 'device',
              tone: 'yellow',
              x: -250,
              y: 10,
              label: bi('PO · Backlog', 'PO · Backlog'),
              highlighted: phase === 'first' || phase === 'mid1',
            },
            {
              id: 'dor',
              shape: 'block',
              tone: 'blue',
              x: -65,
              y: -28,
              label: bi('Gate: DoR', 'Gate: DoR'),
              icon: 'shield',
              highlighted: phase === 'mid2' || phase === 'last',
              badge: { text: bi('Đủ rõ để vào Sprint', 'Ready for Sprint') },
            },
            {
              id: 'dev',
              shape: 'block',
              tone: 'purple',
              x: 95,
              y: 22,
              label: bi('Sprint Devs', 'Sprint Devs'),
              icon: 'cpu',
              highlighted: phase === 'mid1' || phase === 'last',
              badge: { text: bi('Tự ước lượng + AC', 'Self-estimate + AC') },
            },
            {
              id: 'dod',
              shape: 'block',
              tone: 'green',
              x: 255,
              y: -22,
              label: bi('Gate: DoD', 'Gate: DoD'),
              icon: 'zap',
              highlighted: phase === 'mid2' || phase === 'last',
              badge: { text: bi('Increment phát hành ✔', 'Releasable Increment'), tone: 'ok' },
            },
          ],
          links: [
            { id: 'l1', from: 'po', to: 'dor', label: bi('prioritize value', 'prioritize value') },
            { id: 'l2', from: 'dor', to: 'dev', label: bi('Sprint Planning', 'Sprint Planning') },
            { id: 'l3', from: 'dev', to: 'dod', label: bi('verify AC & DoD', 'verify AC & DoD') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.45, offset: 0.34 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.68 },
          ],
        },
        defaultCode: `[SCRUM GATES & ACCOUNTABILITIES]\n• DoR (Entry)  : Story is small (INVEST), clear, dependencies resolved before Sprint Planning.\n• AC (Story)   : Testable functional rules specific to ONE User Story.\n• DoD (Exit)   : Universal quality bar (Code Review + Automated Tests + Security) for ALL Increment items.`,
      };
    },
  },

  P06: {
    id: 'P06',
    titleEn: 'Adaptive Planning, Kanban WIP Limits & Hybrid Transitions',
    subtitleEn:
      'Explain Little’s Law intuitively, enforce Kanban WIP caps, protect Velocity from KPI abuse, and sync Hybrid milestones.',
    durationMin: 16,
    difficulty: 'Intermediate',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Nắm vững Định luật Little (Cycle Time = WIP / Throughput) và lý do giới hạn công việc dở dang (WIP Limit) giúp rút ngắn thời gian hoàn thành',
        'Understand Little’s Law intuitively: why capping Work-in-Progress (WIP) slashes Cycle Time and exposes bottlenecks'
      ),
      bi(
        'Bảo vệ ý nghĩa của Velocity: chỉ số nội bộ để dự báo năng lực nhóm — không dùng để so sánh thưởng phạt giữa các nhóm khác nhau',
        'Protect Story-Point Velocity as an internal team forecasting metric — never compare across teams'
      ),
      bi(
        'Đọc và phân tích 3 biểu đồ thích ứng (Burndown · Burnup · CFD) và đồng bộ cột mốc tích hợp dự án Hybrid',
        'Read Burndown, Burnup, and Cumulative Flow (CFD) charts and coordinate Hybrid integration milestones'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('ĐỊNH LUẬT LITTLE', 'LITTLE’S LAW'),
            value: bi('Giảm WIP ➔ Giảm Cycle Time', 'Lower WIP ➔ Faster Cycle Time'),
            tone: 'ok',
          },
          {
            label: bi('LUẬT VELOCITY', 'VELOCITY RULE'),
            value: bi('Cấm so sánh giữa 2 nhóm!', 'Never compare 2 teams!'),
            tone: 'warn',
          },
          {
            label: bi('BIỂU ĐỒ BẮT NGHẼN', 'BOTTLENECK CHART'),
            value: bi('CFD (Dải màu phình to)', 'CFD (Widening band)'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Áp trần WIP Limit = 3 tại cột Testing để triệt tiêu đa nhiệm (Context Switching) và kích hoạt Swarming gỡ nghẽn',
                    'Enforced WIP Limit = 3 on Testing eliminating multitasking context-switching and triggering team swarming'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '-',
                    text: bi(
                      'Ngăn chặn việc biến Velocity thành KPI thi đua giữa các nhóm hoặc cộng điểm dở dang chưa đạt DoD',
                      'Blocked weaponizing Velocity across teams or counting partially completed stories'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Dùng Burnup tách bạch biến động tổng phạm vi và dùng CFD bắt chính xác cột đang ùn tắc cổ chai',
                        'Used Burnup for scope-change visibility and CFD to pinpoint exact workflow bottlenecks'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Thiết lập lịch tích hợp chung & Dependency Map nối nhịp đội phần cứng Predictive với đội phần mềm Agile',
                        'Aligned hardware Predictive milestones with software Agile Sprints via shared Integration Milestones'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Theo Định luật Little, khi giảm số lượng công việc đang làm dở (WIP), nhóm giảm chuyển đổi ngữ cảnh và rút ngắn thời gian hoàn thành từng đầu việc. Hiện tượng này tương tự việc kiểm soát lượng xe vào cao tốc giúp lưu thông nhanh hơn.',
            'By Little’s Law, capping Work-in-Progress (WIP) cuts context-switching and speeds up Cycle Time — similar to metering highway entry ramps so traffic flows faster.'
          ),
          bi(
            'Sai lầm cần tránh: Khi đề hỏi "Nhóm A đạt 50 Story Points, Nhóm B đạt 25 Story Points — PM nên xử lý thế nào?" → Không so sánh hay ép tăng điểm! Mỗi nhóm có thang quy chiếu Story Points riêng.',
            'Common pitfall: Never compare Team A’s 50 Story Points against Team B’s 25 Points — Story Points are relative and unique to each team.'
          ),
          bi(
            'Khi cột QA Testing đã chạm ngưỡng WIP 3/3, lập trình viên không đẩy thêm thẻ mới sang gây ùn ứ mà chuyển sang hỗ trợ giải phóng điểm nghẽn tại khâu kiểm thử.',
            'When QA Testing hits its 3/3 WIP limit, Developers must NOT push more code into the pile — swarm to clear Testing first.'
          ),
          bi(
            'Nguyên tắc điều phối Hybrid: PM đóng vai trò cầu nối quản trị — cung cấp báo cáo cột mốc và ngân sách tổng cho lãnh đạo trong khi giữ không gian tự chủ theo Sprint cho đội kỹ thuật.',
            'Key Principle in Hybrid: Act as a governance translator — provide macro milestone visibility to executives while protecting agile Sprint autonomy for devs.'
          )
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Bảng Luồng Kéo Kanban: Giới hạn WIP Limit giúp phát hiện điểm nghẽn để cả đội hỗ trợ xử lý',
            'Kanban Pull Board with Explicit WIP Limits & Bottleneck Swarming'
          ),
          subtitle: bi(
            'Cycle Time = WIP / Throughput ➔ Không kéo việc mới khi cột kế tiếp đã chạm trần!',
            'Cycle Time = WIP / Throughput ➔ Stop starting new tickets when downstream hits its WIP cap!'
          ),
          cells: ['Backlog (12)', 'In Dev (2/4)', 'Testing (3/3 Đầy!)', 'Done (28 ✔)'],
          activeIndices:
            phase === 'first'
              ? [1, 2]
              : phase === 'mid1'
                ? [3]
                : phase === 'mid2'
                  ? [2]
                  : [1, 2, 3],
          pointers:
            phase === 'mid2'
              ? [
                  { index: 2, label: 'CFD phình rộng ➔ Cổ chai tại đây!', tone: 'rose' },
                  { index: 1, label: 'Ngừng đẩy thêm ➔ Phụ gỡ Test!', tone: 'orange' },
                ]
              : [
                  { index: 2, label: 'WIP Cap = 3 (Swarming!)', tone: 'orange' },
                  { index: 3, label: 'Throughput tăng bền vững ✔', tone: 'green' },
                ],
          outputPill: {
            label: bi('KHẨU HIỆU KANBAN', 'KANBAN MANTRA'),
            value: bi('Stop starting, start finishing!', 'Stop starting, start finishing!'),
            tone: 'green',
          },
        },
      };
    },
  },

  P07: {
    id: 'P07',
    titleEn: 'Governance Domain: Project Charter, PICC (CCB) & WPD → WPI → WPR',
    subtitleEn:
      'Know what Project Charter authorizes, when CCB vs PO applies, the 5-step PICC chain, and formal Phase/Project Closure.',
    durationMin: 17,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Nắm vững vai trò của Project Charter (văn bản trao quyền chính thức cho PM) và phân biệt thẩm quyền phê duyệt thay đổi giữa CCB và Product Owner',
        'Understand Project Charter authority and when Baseline changes require CCB vs Agile PO backlog reprioritization'
      ),
      bi(
        'Nắm chắc 5 bước tuần tự của Kiểm soát Thay đổi Tích hợp (PICC): Phân tích tác động → Lập CR → CCB duyệt → Cập nhật Baseline/Log → Thực thi',
        'Master the exact 5-step Perform Integrated Change Control (PICC) workflow'
      ),
      bi(
        'Phân biệt quy trình chuyển hóa dữ liệu WPD → WPI → WPR, tri thức Tacit vs Explicit, và thủ tục Đóng dự án (kể cả khi bị hủy sớm)',
        'Trace WPD -> WPI -> WPR, Tacit vs Explicit knowledge, and mandatory Close Project steps'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('THẨM QUYỀN PM', 'PM AUTHORITY'),
            value: bi('Khi Sponsor ký Project Charter', 'Sponsor-signed Project Charter'),
            tone: 'ok',
          },
          {
            label: bi('ĐỔI BASELINE', 'BASELINE CHANGE'),
            value: bi('1. Assess → 2. CR → 3. CCB', '1. Assess → 2. CR → 3. CCB'),
            tone: phase === 'mid1' ? 'warn' : 'ok',
          },
          {
            label: bi('DÒNG DỮ LIỆU', 'DATA FLOW'),
            value: bi('WPD (Thô) → WPI → WPR (Báo cáo)', 'WPD → WPI → WPR'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Xác lập thẩm quyền hợp pháp của PM qua Project Charter và tách rõ ranh giới CCB (chạm Baseline) vs PO (nội bộ Backlog)',
                    'Established PM formal authority via Charter and separated CCB Baseline control from Agile PO backlog ordering'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Khoá chặt 5 bước PICC: bắt buộc phân tích tác động cùng nhóm TRƯỚC khi gửi Change Request lên CCB',
                      'Enforced impact analysis BEFORE submitting formal Change Requests to the CCB'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Tinh luyện số đo thô (WPD) thành chỉ số so chuẩn (WPI) rồi đóng gói thành báo cáo WPR gửi lãnh đạo',
                        'Refined raw field metrics (WPD) into variance insights (WPI) and executive dashboards (WPR)'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Thực hiện đầy đủ thủ tục Đóng dự án (bàn giao phần đã xong, lưu Lessons Learned vào OPA) trước khi giải tán đội',
                        'Completed formal project closure & OPA knowledge transfer prior to releasing team resources'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Nguyên tắc phân định rõ ràng: Dự án Predictive đã chốt Baseline → thay đổi phạm vi/tiến độ/ngân sách phải trình CCB. Dự án Agile giữ ổn định Timebox/Ngân sách → chỉ cần Product Owner sắp xếp lại Product Backlog.',
            'Clear rule: Locked Predictive Baselines require formal CCB approval; Agile feature reprioritization within fixed Timebox/Budget goes through the Product Owner.'
          ),
          bi(
            'Hai lỗi thường gặp ở câu hỏi Change Control: (1) Trình ngay lên CCB khi chưa đánh giá tác động cùng nhóm; (2) Quên ghi nhận trạng thái và lý do vào Change Log khi yêu cầu bị CCB từ chối (Rejected).',
            'Top 2 PICC mistakes: (1) Submitting to CCB before analyzing impact with the team; (2) Failing to log Rejected change requests in the Change Log.'
          ),
          bi(
            'Phân biệt dữ liệu dự án: WPD là số đo thô ("đã chi 500tr"); WPI là thông tin đã so sánh với chuẩn ("CPI = 0.85, vượt 15%"); WPR là báo cáo tổng hợp gửi lãnh đạo.',
            'Data flow rule: WPD = raw number ("spent $50k"); WPI = analyzed against baseline ("CPI = 0.85"); WPR = compiled status report for stakeholders.'
          ),
          bi(
            'Nguyên tắc khi dự án kết thúc sớm: Không giải tán nhóm ngay lập tức. Phải thực hiện Close Project để ghi nhận lý do dừng, bàn giao phần đã hoàn tất và lưu bài học kinh nghiệm vào OPA trước.',
            'Key Principle on Early Termination: Never release the team immediately — formally close the project, document the cause, hand over completed work, and archive Lessons Learned first.'
          )
        ),
        scene: {
          nodes: [
            {
              id: 'req',
              shape: 'device',
              tone: 'neutral',
              x: -250,
              y: 10,
              label: bi('Change Request', 'Change Request'),
              highlighted: phase === 'first',
            },
            {
              id: 'imp',
              shape: 'block',
              tone: 'blue',
              x: -65,
              y: -28,
              label: bi('1. Assess Impact', '1. Assess Impact'),
              icon: 'layers',
              highlighted: phase === 'mid1' || phase === 'last',
              badge: { text: bi('Phân tích đa chiều trước!', 'Analyze impact first!'), tone: 'ok' },
            },
            {
              id: 'ccb',
              shape: 'block',
              tone: 'purple',
              x: 95,
              y: 22,
              label: bi('2. CCB Review', '2. CCB Review'),
              icon: 'shield',
              highlighted: phase === 'mid1' || phase === 'last',
              badge: { text: bi('Approve / Reject CR', 'Approve / Reject CR') },
            },
            {
              id: 'bl',
              shape: 'db',
              tone: 'green',
              x: 255,
              y: -20,
              label: bi('Baselines · WPR · OPA', 'Baselines · WPR · OPA'),
              highlighted: phase === 'mid2' || phase === 'last',
            },
          ],
          links: [
            { id: 'l1', from: 'req', to: 'imp', label: bi('evaluate first', 'evaluate first') },
            { id: 'l2', from: 'imp', to: 'ccb', label: bi('formal CR + options', 'formal CR + options') },
            { id: 'l3', from: 'ccb', to: 'bl', label: bi('update Log & Plan', 'update Log & Plan') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.45, offset: 0.34 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.68 },
          ],
        },
        defaultCode: `[PICC 5-STEP BASELINE CHANGE CHAIN]\n1. Assess holistic impact with team (Scope, Time, Finance, Quality, Risk)\n2. Submit formal Change Request & record in Change Log\n3. CCB / Sponsor reviews and approves or rejects\n4. Update Change Log (always!) + update Baselines if approved\n5. Communicate to affected Stakeholders & execute updated plan`,
      };
    },
  },

  P08: {
    id: 'P08',
    titleEn: 'Stakeholders & Communications: Power/Interest, SEAM & Channels',
    subtitleEn:
      'Shift Resistant stakeholders toward Supportive on SEAM, compute N(N-1)/2 channels, and split Engagement vs Communications plans.',
    durationMin: 15,
    difficulty: 'Intermediate',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Hiểu ma trận mức độ ủng hộ SEAM (Unaware → Resistant → Neutral → Supportive → Leading) để dịch chuyển thái độ hiện tại [C] về mong muốn [D]',
        'Use the Stakeholder Engagement Assessment Matrix (SEAM) to move stakeholders from Current [C] to Desired [D]'
      ),
      bi(
        'Tính đúng số kênh giao tiếp N(N - 1)/2 và chọn đúng Interactive (nhạy cảm/xung đột), Push (lưu vết) hay Pull (tài liệu lớn)',
        'Compute N(N-1)/2 communication channels and match Interactive, Push, and Pull methods to context'
      ),
      bi(
        'Phân biệt rõ phạm vi của Stakeholder Engagement Plan (chiến lược thái độ và gắn kết) và Communications Management Plan (định dạng, kênh và tần suất truyền tin)',
        'Separate Stakeholder Engagement Plan (attitude/resistance) from Communications Management Plan (format/frequency)'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('KÊNH GIAO TIẾP (N=10)', 'CHANNELS (N=10)'),
            value: bi('10 × 9 / 2 = 45 kênh', '10 × 9 / 2 = 45 links'),
            tone: 'ok',
          },
          {
            label: bi('THÁI ĐỘ / KHÁNG CỰ', 'ATTITUDE / RESISTANCE'),
            value: bi('Stakeholder Engagement Plan', 'Stakeholder Engagement Plan'),
            tone: 'ok',
          },
          {
            label: bi('ĐỊNH DẠNG / TẦN SUẤT', 'FORMAT / FREQUENCY'),
            value: bi('Communications Mgmt Plan', 'Communications Mgmt Plan'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Nhận diện sớm toàn bộ Stakeholders, phân loại Power/Interest và định vị khoảng cách thái độ [C → D] trên bảng SEAM',
                    'Mapped stakeholders onto Power/Interest Grid and identified [C -> D] attitude gaps on SEAM'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Ưu tiên giao tiếp trực tiếp 2 chiều (Interactive) cho vấn đề nhạy cảm và kiểm soát sự bùng nổ kênh N(N-1)/2',
                      'Selected real-time Interactive communication for sensitive issues and managed N(N-1)/2 channel growth'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '~',
                      text: bi(
                        'Phân tách dứt điểm 2 kế hoạch hay nhầm: định dạng/kênh truyền tin (Communications) vs chiến lược gắn kết thái độ (Engagement)',
                        'Separated report-delivery mechanics (Communications Plan) from relationship strategy (Engagement Plan)'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Chủ động gặp riêng 1-1 lắng nghe lo ngại thực tế, dịch chuyển trưởng bộ phận từ Resistant sang Supportive',
                        'Closed the SEAM gap via empathetic 1-on-1 engagement, shifting key stakeholder to Supportive'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Khi một bên liên quan phản đối dự án trên ma trận SEAM (Current = Resistant), PM cần chủ động gặp trực tiếp 1-1 để tìm hiểu nỗi lo gốc rễ và xây dựng sự đồng thuận (Desired = Supportive), thay vì né tránh.',
            'When a key stakeholder resists a new system [C = Resistant], engage 1-on-1 early to uncover concerns and move them toward [D = Supportive].'
          ),
          bi(
            'Lưu ý tính số kênh giao tiếp: Đề viết "PM làm việc cùng đội 9 người, vừa thêm 2 người mới" → nhớ tính cả PM: ban đầu N = 10 (45 kênh), lúc sau N = 12 (66 kênh), tăng thêm 21 kênh.',
            'Math check: "A PM leads a team of 9" means N = 10 people (45 channels). Always check whether the PM is already counted in N.'
          ),
          bi(
            'Quy tắc phân biệt hai kế hoạch: Vấn đề "sót báo cáo, sai định dạng, gửi trễ" → cập nhật Communications Plan. Vấn đề "vắng họp, nghi ngại, phản đối thay đổi" → cập nhật Stakeholder Engagement Plan.',
            'Twin-choice filter: Missed/cluttered reports -> Communications Plan. Absenteeism, skepticism, or pushback -> Stakeholder Engagement Plan.'
          ),
          bi(
            'Trình tự xử lý khi có Stakeholder mới giữa dự án: (1) Ghi vào Stakeholder Register → (2) Phân tích Power/Interest & SEAM → (3) Cập nhật Plans → (4) Gặp gỡ gắn kết.',
            'Key Principle for new mid-project stakeholders: 1. Update Register -> 2. Analyze Power/Interest & SEAM -> 3. Update Plans -> 4. Engage proactively.'
          )
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Ma trận Đánh giá Mức độ Ủng hộ SEAM (Stakeholder Engagement Assessment Matrix)',
            'Stakeholder Engagement Assessment Matrix (SEAM: C → D)'
          ),
          subtitle: bi(
            'C = Hiện tại (Current) · D = Mong muốn (Desired) ➔ Dùng giao tiếp Interactive 1-1 để kéo C về trùng D!',
            'C = Current · D = Desired ➔ Use proactive 1-on-1 Interactive dialogue to close the C -> D gap!'
          ),
          cells: ['1. Unaware', '2. Resistant [C]', '3. Neutral', '4. Supportive [D]', '5. Leading'],
          activeIndices:
            phase === 'first'
              ? [1, 3]
              : phase === 'mid1'
                ? [1, 2, 3]
                : phase === 'mid2'
                  ? [2, 3]
                  : [3, 4],
          pointers:
            phase === 'last'
              ? [
                  { index: 3, label: 'Đã kéo C trùng D: Ủng hộ ✔', tone: 'green' },
                  { index: 4, label: 'Sponsor / Key Champions', tone: 'blue' },
                ]
              : [
                  { index: 1, label: 'Hiện tại [C]: Ngại thay đổi', tone: 'orange' },
                  { index: 3, label: 'Mục tiêu [D]: Đồng hành ✔', tone: 'green' },
                ],
          outputPill: {
            label: bi('PHƯƠNG THỨC ƯU TIÊN', 'TOP CHANNEL'),
            value: bi('Interactive (Đối thoại 1-1)', 'Interactive (Face-to-face)'),
            tone: 'green',
          },
        },
      };
    },
  },

  P09: {
    id: 'P09',
    titleEn: 'Resources & Team: Tuckman Ladder, Emotional Intelligence & Conflict',
    subtitleEn:
      'Co-create the Team Charter, adapt leadership across Tuckman’s 5 stages, and resolve conflict via Win-Win Collaborate.',
    durationMin: 15,
    difficulty: 'Intermediate',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Phân biệt Team Charter (do cả nhóm tự thảo luận viết ra để quy ước cách làm việc) với Project Charter (do Sponsor ký)',
        'Distinguish Team Charter (team-authored social contract) from Sponsor-signed Project Charter'
      ),
      bi(
        'Điều chỉnh phong cách lãnh đạo theo 5 giai đoạn Tuckman (Forming → Storming → Norming → Performing → Adjourning) và nhớ thay đổi nhân sự sẽ đưa nhóm quay về Forming',
        'Adapt leadership across Tuckman’s 5 stages and remember adding/removing members resets the ladder to Forming'
      ),
      bi(
        'Áp dụng Trí tuệ cảm xúc (EI) và 5 phương pháp xử lý xung đột: ưu tiên hàng đầu là Collaborate / Problem Solve (Win-Win)',
        'Apply Emotional Intelligence and PMI’s #1 conflict resolution mode: Collaborate / Problem Solve (Win-Win)'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('THOẢ ƯỚC ĐỘI NHÓM', 'GROUND RULES'),
            value: bi('Team Charter (Cả nhóm viết)', 'Team Charter (Co-created)'),
            tone: 'ok',
          },
          {
            label: bi('THAY ĐỔI NHÂN SỰ', 'ROSTER CHANGE'),
            value: bi('Nhóm quay lại Forming!', 'Resets back to Forming!'),
            tone: phase === 'mid1' ? 'warn' : 'ok',
          },
          {
            label: bi('XỬ LÝ XUNG ĐỘT #1', 'BEST CONFLICT MODE'),
            value: bi('Collaborate / Problem Solve', 'Collaborate / Problem Solve'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Cả đội kỹ thuật cùng thảo luận xây dựng Team Charter quy định giờ họp lõi, chuẩn review code và ứng xử văn minh',
                    'Facilitated team co-creation of Team Charter ground rules from day one'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '~',
                    text: bi(
                      'Điều chỉnh vai trò PM từ Chỉ dẫn (Forming) → Huấn luyện (Storming) → Hỗ trợ (Norming) → Trao quyền (Performing)',
                      'Shifted PM leadership style dynamically across Tuckman’s 5 development stages'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Nuôi dưỡng động lực nội tại (Autonomy · Mastery · Purpose) và thiết lập giờ giao thoa công bằng cho nhóm từ xa',
                        'Cultivated intrinsic motivation and equitable overlap hours for distributed Virtual Teams'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Hoà giải tranh cãi kỹ thuật theo hướng đối chiếu dữ liệu khách quan (Collaborate) và hỗ trợ đào tạo 1-1 cho người làm chậm',
                        'Resolved conflict via data-driven Collaboration and coached underperforming members privately'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Phân biệt hai loại Charter: Project Charter do Sponsor ký để trao quyền cho PM; Team Charter là thỏa ước làm việc do toàn bộ thành viên nhóm cùng thảo luận và thống nhất (nếu PM tự viết áp đặt sẽ sai nguyên tắc).',
            'Never mix up the two Charters: Sponsor signs the Project Charter; the team co-writes the Team Charter (a top-down PM-written rulebook is an exam trap).'
          ),
          bi(
            'Lưu ý về động học nhóm Tuckman: Nếu nhóm đang ở giai đoạn Performing mà có thành viên mới gia nhập hoặc rời đi, nhóm sẽ chuyển về giai đoạn Forming để thiết lập lại mối quan hệ và quy ước phối hợp.',
            'Classic Tuckman principle: Adding even top-tier Senior Engineers to a Performing team resets team dynamics back to Forming.'
          ),
          bi(
            'Với nhóm làm việc từ xa đa múi giờ (Virtual Team), cần thống nhất khung giờ giao thoa hợp lý (Overlap Hours) và họp video định kỳ để duy trì sự gắn kết.',
            'For global Virtual Teams, establish fair overlap core hours and interactive video check-ins to prevent cultural drift and isolation.'
          ),
          bi(
            'Nguyên tắc giải quyết xung đột: Tranh luận chuyên môn lành mạnh → để nhóm tự giải quyết trước; căng thẳng cá nhân → gặp riêng 1-1 rồi dẫn hướng Collaborate (Win-Win); chỉ dùng Force khi khẩn cấp an toàn/pháp luật.',
            'Key Principle: Let teams self-resolve healthy technical debates first; escalate to private 1-on-1 + Win-Win Collaboration if tense; use Force ONLY in safety/legal emergencies.'
          )
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Thang 5 Bậc Phát triển Nhóm của Tuckman & Sự Dịch chuyển Phong cách Lãnh đạo',
            'Tuckman 5-Stage Team Ladder & Adaptive Leadership Styles'
          ),
          subtitle: bi(
            'Thêm/bớt thành viên sẽ đưa nhóm lùi về Bậc 1 (Forming) để thiết lập lại nhịp phối hợp!',
            'Adding or removing members resets the team back to Stage 1 (Forming)!'
          ),
          cells: ['1. Forming', '2. Storming', '3. Norming', '4. Performing', '5. Adjourning'],
          activeIndices:
            phase === 'first'
              ? [0]
              : phase === 'mid1'
                ? [0, 1]
                : phase === 'mid2'
                  ? [2, 3]
                  : [1, 3],
          pointers:
            phase === 'first'
              ? [{ index: 0, label: 'Directing + Viết Team Charter', tone: 'blue' }]
              : phase === 'mid1'
                ? [
                    { index: 1, label: 'Storming: Coaching + EI', tone: 'orange' },
                    { index: 0, label: 'Thêm người mới ➔ Về đây!', tone: 'rose' },
                  ]
                : [
                    { index: 1, label: 'Xung đột ➔ Collaborate', tone: 'orange' },
                    { index: 3, label: 'Performing: Trao quyền ✔', tone: 'green' },
                  ],
          outputPill: {
            label: bi('ƯU TIÊN XUNG ĐỘT', 'CONFLICT #1'),
            value: bi('Collaborate / Problem Solve (Win–Win)', 'Collaborate / Problem Solve'),
            tone: 'green',
          },
        },
      };
    },
  },

  P10: {
    id: 'P10',
    titleEn: 'Scope & Quality: WBS Baseline, Scope Creep Control & Deliverable Acceptance',
    subtitleEn:
      'Decompose deliverables via 100% WBS Rule, block Scope Creep & Gold Plating, and separate QA, QC, and Validate Scope.',
    durationMin: 16,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Nắm vững cấu trúc phân rã sản phẩm WBS (100% Rule, gói công việc Work Package), bộ ba Scope Baseline và ma trận truy vết RTM',
        'Master deliverable-oriented WBS (100% Rule, Work Packages), the 3-part Scope Baseline, and RTM'
      ),
      bi(
        'Phân biệt nguồn gốc Scope Creep (yêu cầu ngoài phạm vi từ bên ngoài) và Gold Plating (đội dự án tự ý bổ sung tính năng ngoài yêu cầu)',
        'Distinguish customer-driven Scope Creep from internal developer Gold Plating'
      ),
      bi(
        'Nắm chắc trình tự kiểm soát: QA (kiểm toán quy trình) → QC (kiểm sản phẩm nội bộ ra Verified) → Validate Scope (khách nghiệm thu ra Accepted)',
        'Sequence Manage Quality (QA process) -> Control Quality (Verified) -> Validate Scope (Accepted) -> Close'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      if (phase === 'first') {
        return {
          telemetry: [
            {
              label: bi('SCOPE BASELINE', 'SCOPE BASELINE'),
              value: bi('Statement · WBS · Dict', 'Statement · WBS · Dict'),
              tone: 'ok',
            },
            {
              label: bi('QUY TẮC WBS', 'WBS RULE'),
              value: bi('100% Rule · Work Package', '100% Rule · Work Package'),
              tone: 'ok',
            },
            {
              label: bi('TRUY VẾT YÊU CẦU', 'TRACEABILITY'),
              value: bi('RTM (Need → WBS → Test)', 'RTM (Need → WBS → Test)'),
              tone: 'ok',
            },
          ],
          whatChanged: [
            {
              op: '+',
              text: bi(
                'Chẻ nhỏ sản phẩm theo cây WBS tuân thủ Quy tắc 100% và dùng ma trận RTM nối mỗi yêu cầu tới tận kịch bản Test',
                'Decomposed deliverables via 100%-Rule WBS and linked requirements end-to-end with RTM'
              ),
            },
          ],
          callout: makeStepCallout(
            s,
            total,
            bi(
              'WBS là cấu trúc phân cấp các sản phẩm bàn giao tuân thủ Quy tắc 100% (tổng các nhánh con bằng đúng 100% nhánh cha); còn RTM liên kết từng yêu cầu từ mục tiêu kinh doanh đến ca kiểm thử.',
              'WBS is a deliverable hierarchy obeying the 100% Rule (lowest level = Work Package), while RTM traces every requirement from business goal down to test case.'
            ),
            bi('', ''),
            bi('', ''),
            bi('', '')
          ),
          scene: {
            nodes: [
              {
                id: 'rtm',
                shape: 'device',
                tone: 'neutral',
                x: -265,
                y: 18,
                label: bi('Requirements · RTM', 'Requirements · RTM'),
                highlighted: true,
              },
              {
                id: 'sb',
                shape: 'block',
                tone: 'blue',
                x: -5,
                y: -38,
                label: bi('Scope Baseline', 'Scope Baseline'),
                icon: 'layers',
                highlighted: true,
                badge: { text: bi('Statement · WBS · Dict', 'Statement · WBS · Dict'), tone: 'ok' },
              },
              {
                id: 'wp',
                shape: 'block',
                tone: 'green',
                x: 260,
                y: 22,
                label: bi('Work Package', 'Work Package'),
                icon: 'shield',
                highlighted: true,
                badge: { text: bi('100% Rule · Cấp lá WBS', '100% Rule · Lowest WBS'), tone: 'ok' },
              },
            ],
            links: [
              { id: 'l1', from: 'rtm', to: 'sb', label: bi('trace & baseline', 'trace & baseline') },
              { id: 'l2', from: 'sb', to: 'wp', label: bi('decompose 100%', 'decompose 100%') },
            ],
            packets: [
              { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
              { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.45, offset: 0.48 },
            ],
          },
          defaultCode: `[3-PART SCOPE BASELINE]\n1. Project Scope Statement (Deliverables + Acceptance Criteria + Explicit Exclusions)\n2. WBS (Deliverable-oriented hierarchy obeying 100% Rule down to Work Packages)\n3. WBS Dictionary (Detailed technical & quality specs per WBS node)`,
        };
      }

      if (phase === 'mid1') {
        return {
          telemetry: [
            {
              label: bi('SCOPE CREEP', 'SCOPE CREEP'),
              value: bi('Khách nhét thêm (vòng qua CCB)', 'External creep (no CCB)'),
              tone: 'bad',
            },
            {
              label: bi('GOLD PLATING', 'GOLD PLATING'),
              value: bi('Dev tự vẽ thêm ngoài Baseline', 'Internal unrequested extras'),
              tone: 'warn',
            },
            {
              label: bi('CỔNG BẢO VỆ', 'GOVERNANCE GATE'),
              value: bi('Change Request → CCB', 'Change Request → CCB'),
              tone: 'ok',
            },
          ],
          whatChanged: [
            {
              op: '-',
              text: bi(
                'Chặn đứng cả hai hướng phình phạm vi lén lút: khách hàng nhờ riêng (Scope Creep) và kỹ sư tự làm tặng (Gold Plating)',
                'Blocked both external Scope Creep and internal developer Gold Plating'
              ),
            },
            {
              op: '+',
              text: bi(
                'Đưa mọi đề xuất thêm tính năng qua đánh giá tác động và phê duyệt tại CCB',
                'Routed all scope additions through formal impact assessment and CCB review'
              ),
            },
          ],
          callout: makeStepCallout(
            s,
            total,
            bi('', ''),
            bi(
              'Lưu ý về Gold Plating: Khi đề bài nêu "lập trình viên tự thêm một tính năng nhỏ miễn phí và không làm trễ lịch", đây vẫn là Gold Plating và không được tự ý thực hiện vì nằm ngoài Scope Baseline.',
              'Gold Plating check: "A developer adds a small free bonus feature without delaying the schedule" is still Gold Plating — reject unauthorized extras outside the Baseline.'
            ),
            bi('', ''),
            bi('', '')
          ),
          scene: {
            nodes: [
              {
                id: 'req',
                shape: 'device',
                tone: 'neutral',
                x: -265,
                y: 12,
                label: bi('Extra Scope Idea', 'Extra Scope Idea'),
                highlighted: true,
              },
              {
                id: 'trap',
                shape: 'block',
                tone: 'rose',
                x: 10,
                y: -58,
                label: bi('Creep / Gold', 'Creep / Gold'),
                icon: 'alert',
                highlighted: true,
                badge: { text: bi('Bypass CCB — Chặn!', 'Bypass CCB — Reject!'), tone: 'bad' },
              },
              {
                id: 'ccb',
                shape: 'block',
                tone: 'green',
                x: 225,
                y: 42,
                label: bi('CCB Approval', 'CCB Approval'),
                icon: 'shield',
                highlighted: true,
                badge: { text: bi('Impact Analysis ✔', 'Impact Analysis ✔'), tone: 'ok' },
              },
            ],
            links: [
              { id: 'l1', from: 'req', to: 'trap', style: 'danger', label: bi('unauthorized add', 'unauthorized add') },
              { id: 'l2', from: 'req', to: 'ccb', label: bi('Change Request', 'Change Request') },
            ],
            packets: [
              { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.44 },
              { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.45 },
            ],
          },
          defaultCode: `[SCOPE CREEP VS GOLD PLATING]\n• Scope Creep  : External stakeholder sneaks in extra work bypassing CCB / PO.\n• Gold Plating : Internal team member adds unrequested features ("even at zero extra cost").\n• PMI Fix      : Enforce Scope Baseline Exclusions + route valuable ideas via Change Request!`,
        };
      }

      return {
        telemetry: [
          {
            label: bi('MANAGE QUALITY (QA)', 'MANAGE QUALITY (QA)'),
            value: bi('Kiểm toán QUY TRÌNH', 'Process audit & prevention'),
            tone: 'ok',
          },
          {
            label: bi('CONTROL QUALITY (QC)', 'CONTROL QUALITY (QC)'),
            value: bi('Verified Deliverable (Nội bộ)', 'Verified Deliverable'),
            tone: 'ok',
          },
          {
            label: bi('VALIDATE SCOPE', 'VALIDATE SCOPE'),
            value: bi('Accepted Deliverable (Khách ký)', 'Accepted Deliverable'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'mid2'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Khoá thứ tự bất biến: Đội dự án chạy Control Quality tạo Verified Deliverable TRƯỚC khi mời khách hàng họp Validate Scope!',
                    'Enforced internal Control Quality verification strictly BEFORE customer Validate Scope acceptance'
                  ),
                },
              ]
            : [
                {
                  op: '+',
                  text: bi(
                    'Phân vai chuẩn xác khi chẩn đoán nguyên nhân: lỗi lặp lại do hỏng quy trình → sửa QA; lỗi lọt sang buổi UAT của khách → siết lại QC nội bộ!',
                    'Mapped root-cause fixes cleanly: recurring defects -> QA process audit; bugs found during customer UAT -> tighten internal QC'
                  ),
                },
              ],
        callout: makeStepCallout(
          s,
          total,
          bi('', ''),
          bi('', ''),
          bi(
            'Không đảo ngược trình tự: Control Quality (QC nội bộ kiểm tra kỹ thuật → Verified) luôn thực hiện trước Validate Scope (khách hàng nghiệm thu UAT → Accepted).',
            'Never invert the sequence: internal Control Quality (producing Verified Deliverables) MUST happen before customer Validate Scope (producing Accepted Deliverables).'
          ),
          bi(
            'Nguyên tắc phân biệt nhanh: QA kiểm toán QUY TRÌNH phòng ngừa · QC kiểm tra SẢN PHẨM nội bộ (Verified) · Validate Scope lấy XÁC NHẬN KHÁCH HÀNG (Accepted).',
            'Key Principle: QA audits the PROCESS · QC inspects the PRODUCT internally (Verified) · Validate Scope secures CUSTOMER SIGN-OFF (Accepted).'
          )
        ),
        scene: {
          nodes: [
            {
              id: 'del',
              shape: 'device',
              tone: 'neutral',
              x: -285,
              y: 24,
              label: bi('Deliverable + QA', 'Deliverable + QA'),
              highlighted: phase === 'last',
            },
            {
              id: 'qc',
              shape: 'block',
              tone: 'blue',
              x: -92,
              y: -42,
              label: bi('Control Quality', 'Control Quality'),
              icon: 'shield',
              highlighted: true,
              badge: { text: bi('Verified Deliverable', 'Verified Deliverable'), tone: 'ok' },
            },
            {
              id: 'val',
              shape: 'block',
              tone: 'purple',
              x: 105,
              y: 32,
              label: bi('Validate Scope', 'Validate Scope'),
              icon: 'zap',
              highlighted: true,
              badge: { text: bi('Accepted Deliverable', 'Accepted Deliverable'), tone: 'ok' },
            },
            {
              id: 'cls',
              shape: 'db',
              tone: 'green',
              x: 290,
              y: -26,
              label: bi('Close Project/Phase', 'Close Project/Phase'),
              highlighted: phase === 'last',
            },
          ],
          links: [
            { id: 'l1', from: 'del', to: 'qc', label: bi('internal QC', 'internal QC') },
            { id: 'l2', from: 'qc', to: 'val', label: bi('Verified ✔', 'Verified ✔') },
            { id: 'l3', from: 'val', to: 'cls', label: bi('Accepted ✔', 'Accepted ✔') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.45, offset: 0.34 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.68 },
          ],
        },
        defaultCode: `[DELIVERABLE ACCEPTANCE PIPELINE]\nDirect & Manage Work (+ Manage Quality QA) -> Deliverable\n  -> Control Quality (Internal QC)         -> Verified Deliverable\n  -> Validate Scope (Customer UAT)         -> Accepted Deliverable\n  -> Close Project or Phase                -> Operations Handover`,
      };
    },
  },

  P11: {
    id: 'P11',
    titleEn: 'Schedule & Finance: Critical Path, Reserves & 60-Second EVM Diagnostics',
    subtitleEn:
      'Intuit EVM (PV, EV, AC, CPI, SPI, EAC) via a concrete software budget story, compress Critical Path, and separate Reserves.',
    durationMin: 18,
    difficulty: 'Advanced',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Nắm vững các chỉ số EVM qua ví dụ 4 module × 100tr VNĐ: luôn đặt EV đứng đầu công thức (CPI = EV/AC, SPI = EV/PV, EAC = BAC/CPI)',
        'Master EVM via a 4-module budget story: always put EV first (CPI = EV/AC, SPI = EV/PV, EAC = BAC/CPI)'
      ),
      bi(
        'Nén lịch trình trên Đường găng (Float = 0): phân biệt Crashing (tăng chi phí) và Fast-Tracking (chạy song song tăng rủi ro làm lại)',
        'Compress the Critical Path (Float = 0) by trading off Crashing (extra cost) vs Fast-Tracking (rework risk)'
      ),
      bi(
        'Phân biệt hai quỹ dự phòng: Contingency Reserve (rủi ro đã biết, nằm trong Cost Baseline, thuộc thẩm quyền PM) và Management Reserve (rủi ro chưa lường trước, cần trình CCB)',
        'Separate PM-controlled Contingency Reserve (inside Cost Baseline) from CCB-controlled Management Reserve'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('CHỈ SỐ EVM MẪU', 'EVM STORY SNAPSHOT'),
            value: bi('EV=150 · PV=200 · AC=200', 'EV=150 · PV=200 · AC=200'),
            tone: phase === 'first' ? 'warn' : 'ok',
          },
          {
            label: bi('ĐƯỜNG GĂNG (CPM)', 'CRITICAL PATH'),
            value: bi('Total Float = 0 ngày', 'Total Float = 0 days'),
            tone: 'warn',
          },
          {
            label: bi('QUỸ CHƯA BIẾT', 'UNKNOWN-UNKNOWNS'),
            value: bi('Management Reserve (qua CCB)', 'Mgmt Reserve (via CCB)'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Minh họa EVM bằng ví dụ 400tr VNĐ: xong 1.5 module (EV=150tr) trên lịch 2 module (PV=200tr), đã chi 200tr (AC) ➔ CPI = SPI = 0.75',
                    'Decoded EVM via concrete numbers: EV=150 vs PV=200 & AC=200 -> CPI = 0.75 (over budget) & SPI = 0.75 (behind schedule)'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '~',
                    text: bi(
                      'Khi Sponsor không cấp thêm tiền để rút lịch trên Đường găng: loại Crashing, chọn Fast-Tracking cho các phụ thuộc tuỳ ý!',
                      'When budget is frozen on a delayed Critical Path: ruled out Crashing and selected Fast-Tracking with rework monitoring'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Khoá ranh giới giải ngân: PM chủ động chi Contingency Reserve cho Known-Unknowns; phải trình CCB khi xin Management Reserve!',
                        'Separated PM-authorized Contingency Reserve from CCB-governed Management Reserve'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Chẩn đoán nhanh: thấy CPI < 1 hoặc SPI < 1 thì bước FIRST luôn là phân tích nguyên nhân gốc (Variance Analysis) cùng đội!',
                        'Installed EVM diagnostic reflex: run Root Cause / Variance Analysis FIRST before requesting funds or compressing schedule'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Nguyên tắc ghi nhớ công thức EVM: Luôn đặt EV (giá trị công việc thực sự hoàn thành) đứng đầu! CPI = EV / AC (< 1 là vượt ngân sách); SPI = EV / PV (< 1 là chậm tiến độ).',
            'EVM rule: Always put EV (work actually earned) FIRST. CPI = EV / AC (<1 over budget); SPI = EV / PV (<1 behind schedule); typical EAC = BAC / CPI.'
          ),
          bi(
            'Lưu ý về nén tiến độ: Rút ngắn tác vụ có Float > 0 không làm sớm ngày kết thúc dự án. Chỉ nén các tác vụ trên Đường găng (Float = 0): còn ngân sách xét Crashing, không thêm ngân sách xét Fast-Tracking.',
            'Schedule rule: Compressing non-critical tasks with positive Float saves zero days. Compress ONLY Critical Path tasks: Crashing costs money; Fast-Tracking adds rework risk.'
          ),
          bi(
            'Phân biệt thẩm quyền hai quỹ dự phòng: Rủi ro đã ghi trong Risk Register xảy ra → PM sử dụng Contingency Reserve. Biến cố bất ngờ chưa lường trước → lập Change Request xin Management Reserve.',
            'Reserve authority: Realized Risk Register item -> PM uses Contingency Reserve. Unforeseen shock (Unknown-Unknown) -> submit Change Request to CCB for Management Reserve.'
          ),
          bi(
            'Nguyên tắc kết hợp Schedule và EVM: Nếu đề cho SPI = 0.85 (chậm tiến độ) và CPI = 1.15 (dư ngân sách) → phương án hợp lý để khôi phục tiến độ trên Đường găng là Crashing.',
            'Key Principle: SPI = 0.85 (behind schedule) + CPI = 1.15 (under budget) -> use the budget cushion for targeted Crashing on the Critical Path.'
          )
        ),
        memoryScene: {
          kind: 'refs',
          leftTitle: bi('Tín hiệu EVM / Biến cố Ngân sách', 'Metric / Budget Event'),
          rightTitle: bi('Quyết định Chuẩn xác của PM', 'Authoritative PM Action'),
          names: [
            {
              id: 'r0',
              name: 'EV = 150tr · PV = 200tr · AC = 200tr (BAC = 400tr)',
              note:
                phase === 'first'
                  ? bi('EV luôn đứng trước!', 'EV always comes first!')
                  : undefined,
              targetId: 'o0',
            },
            {
              id: 'r1',
              name: 'Rủi ro ĐÃ BIẾT trong Risk Register nổ ra',
              note:
                phase === 'mid2'
                  ? bi('Known-Unknowns', 'Known-Unknowns')
                  : undefined,
              targetId: 'o1',
            },
            {
              id: 'r2',
              name: 'Biến cố LẠ CHƯA TỪNG LƯỜNG TRƯỚC nổ ra',
              note:
                phase === 'mid2' || phase === 'last'
                  ? bi('Unknown-Unknowns', 'Unknown-Unknowns')
                  : undefined,
              targetId: 'o2',
            },
          ],
          objects: [
            {
              id: 'o0',
              typeTag: 'CPI=0.75 · SPI=0.75',
              value: 'Lố tiền & Trễ lịch · EAC = 533tr',
              fields: ['FIRST: Phân tích nguyên nhân sai lệch (Variance Analysis)'],
              tone: phase === 'first' || phase === 'last' ? 'orange' : 'blue',
            },
            {
              id: 'o1',
              typeTag: 'Contingency Reserve',
              value: 'Nằm TRONG Cost Baseline',
              fields: ['PM tự thẩm quyền kích hoạt ứng phó ngay'],
              tone: phase === 'mid2' ? 'green' : 'blue',
            },
            {
              id: 'o2',
              typeTag: 'Management Reserve',
              value: 'Nằm NGOÀI Cost Baseline',
              fields: ['Bắt buộc lập Change Request trình Sponsor / CCB'],
              tone: phase === 'mid2' || phase === 'last' ? 'rose' : 'purple',
              badge: phase === 'mid2' ? bi('Phải qua CCB!', 'Requires CCB!') : undefined,
            },
          ],
        },
        defaultCode: `[60-SECOND EVM CHEAT SHEET — 4 MODULES × 100M = 400M BAC]\n• Month 2 Check : Planned PV = 200M | Earned EV = 150M (1.5 mods) | Spent AC = 200M\n• CPI = EV / AC = 150 / 200 = 0.75 (< 1.0 -> Over budget!)\n• SPI = EV / PV = 150 / 200 = 0.75 (< 1.0 -> Behind schedule!)\n• EAC = BAC / CPI = 400 / 0.75 = 533M | TCPI = (BAC - EV) / (BAC - AC) = 1.25`,
      };
    },
  },

  P12: {
    id: 'P12',
    titleEn: 'Risk & Sourcing: Risk vs Issue, Response Strategies & Contracts (FFP / T&M)',
    subtitleEn:
      'Separate uncertain future Risks from present Issues, master 10 response strategies, and pick FFP vs CPFF/T&M by risk bearer.',
    durationMin: 16,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Phân biệt theo mốc thời gian: sự kiện tương lai chưa chắc chắn (<100%) ghi vào Risk Register; sự kiện đã xảy ra (=100%) ghi vào Issue Log kèm Contingency/Workaround',
        'Apply the tense filter: uncertain future (<100%) -> Risk Register; realized event (=100%) -> Issue Log + Workaround'
      ),
      bi(
        'Phân biệt 5 chiến lược Threat ↔ 5 chiến lược Opportunity, cùng Residual Risk (rủi ro tàn dư) và Secondary Risk (rủi ro phát sinh từ giải pháp ứng phó)',
        'Pair the 5 Threat and 5 Opportunity strategies, separating Residual Risk from Secondary Risk'
      ),
      bi(
        'Chọn hợp đồng theo bên chịu rủi ro vượt chi phí (FFP = Seller chịu; CPFF/CPIF = Buyer chịu; T&M gắn trần NTE) và ưu tiên Đàm phán trực tiếp khi có tranh chấp',
        'Match contract types (FFP, CPFF, CPIF, T&M + NTE) by cost-overrun risk bearer and prioritize Direct Negotiation'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('CHƯA XẢY RA (<100%)', 'FUTURE UNCERTAIN'),
            value: bi('Risk Register + Contingency', 'Risk Register + Contingency'),
            tone: 'ok',
          },
          {
            label: bi('ĐÃ XẢY RA (100%)', 'ALREADY HAPPENED'),
            value: bi('Issue Log + Workaround', 'Issue Log + Workaround'),
            tone: phase === 'first' ? 'warn' : 'ok',
          },
          {
            label: bi('HỢP ĐỒNG & TRANH CHẤP', 'CONTRACTS & DISPUTES'),
            value: bi('FFP (Rõ) · CPFF (Mờ) · Negotiate #1', 'FFP · CPFF · Negotiate #1'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Tách rạch ròi theo mốc thời gian: nguy cơ sắp tới vào Risk Register, sự cố đã phát sinh sáng nay vào Issue Log!',
                    'Separated future uncertain Risks (Risk Register) from already-realized Issues (Issue Log)'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Đối xứng hoá 10 chiến lược (Avoid/Exploit · Transfer/Share · Mitigate/Enhance) và theo dõi Secondary Risk mới nảy sinh',
                      'Paired 5 Threat and 5 Opportunity strategies while tracking Residual & Secondary Risks'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Chọn loại hợp đồng theo độ rõ của Phạm vi: FFP giao rủi ro đội giá cho Seller; CPFF/CPIF dùng cho R&D mờ; T&M khoá trần NTE',
                        'Matched FFP (Seller bears overrun risk), CPFF/CPIF (Buyer bears R&D risk), and T&M (capped via NTE)'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Giải quyết tranh chấp nhà thầu theo trình tự: Đọc hợp đồng → Đàm phán trực tiếp (Negotiation) → ADR → Khởi kiện',
                        'Prioritized contract review and Direct Negotiation before ADR or Litigation in vendor disputes'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Quy tắc đối chiếu thời gian: Đề viết "could / might delay" (chưa xảy ra) → ghi vào Risk Register. Đề viết "has resigned / server crashed" (đã xảy ra 100%) → ghi vào Issue Log.',
            'Tense check: "Might/could happen" -> Risk Register. "Has occurred / just resigned" -> Issue Log + Contingency/Workaround.'
          ),
          bi(
            'Phân biệt Residual và Secondary Risk: Thuê ngoài để tránh rủi ro thiếu nhân sự lại phát sinh rủi ro mới là "lộ mã nguồn" → đó là Secondary Risk (rủi ro thứ cấp sinh ra trực tiếp từ giải pháp ứng phó).',
            'Residual vs Secondary: Outsourcing code to mitigate staffing shortages creates a new "source-code leak" threat -> Secondary Risk.'
          ),
          bi(
            'Nguyên tắc chọn hợp đồng theo rủi ro chi phí: Phạm vi rõ 100% chọn FFP (Vendor chịu rủi ro vượt chi phí); R&D chưa rõ chọn CPFF/CPIF (Buyer chịu chi phí thực); thuê chuyên gia theo giờ chọn T&M kèm trần NTE.',
            'Contract risk rule: Clear scope -> FFP (Seller bears cost risk); uncertain R&D -> CPFF/CPIF (Buyer bears cost risk); staff augmentation -> T&M with Not-To-Exceed cap.'
          ),
          bi(
            'Nguyên tắc xử lý tranh chấp Nhà thầu: Không đe dọa khởi kiện hay dừng thanh toán ngay — phương án ưu tiên nhất luôn là rà soát điều khoản SOW và Đàm phán trực tiếp (Direct Negotiation).',
            'Key Principle on Vendor Disputes: Review contract terms first, then engage in face-to-face Direct Negotiation — Litigation is always the absolute last resort.'
          )
        ),
        scene: {
          nodes: [
            {
              id: 'ev',
              shape: 'device',
              tone: 'neutral',
              x: -245,
              y: 10,
              label: bi('Project / Vendor Event', 'Project / Vendor Event'),
              highlighted: phase === 'first' || phase === 'last',
            },
            {
              id: 'rsk',
              shape: 'block',
              tone: 'blue',
              x: 15,
              y: -50,
              label: bi('Risk Register', 'Risk Register'),
              icon: 'shield',
              highlighted: phase === 'first' || phase === 'mid1',
              badge: { text: bi('Nếu "might / could"', 'If "might / could"'), tone: 'ok' },
            },
            {
              id: 'iss',
              shape: 'block',
              tone: 'orange',
              x: 195,
              y: 42,
              label: bi('Issue Log · Negotiate', 'Issue Log · Negotiate'),
              icon: 'alert',
              highlighted: phase === 'first' || phase === 'mid2' || phase === 'last',
              badge: { text: bi('Đã xảy ra = 100%!', 'Realized = 100%!') },
            },
          ],
          links: [
            { id: 'l1', from: 'ev', to: 'rsk', label: bi('uncertain (<100%)', 'uncertain (<100%)') },
            {
              id: 'l2',
              from: 'ev',
              to: 'iss',
              style: 'dashed',
              label: bi('realized today!', 'realized today!'),
            },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.45, offset: 0.45 },
          ],
        },
        defaultCode: `[CONTRACT RISK BEARER & DISPUTE LADDER]\n• FFP (Firm Fixed Price)  : Clear scope -> SELLER bears cost overrun risk.\n• CPFF / CPIF (Cost Plus) : Uncertain R&D -> BUYER bears cost overrun risk.\n• T&M (Time & Materials)  : Hourly experts -> Always set NTE (Not-To-Exceed) ceiling!\n• Vendor Dispute Order    : 1. Check Contract -> 2. Direct Negotiation (#1) -> 3. ADR -> 4. Litigation.`,
      };
    },
  },

  P13: {
    id: 'P13',
    titleEn: '65-Second Situational Question Analysis: FIRST · NEXT · BEST · NOT',
    subtitleEn:
      'Read the final question sentence first, lock onto Agile/Predictive/Hybrid cues, and separate FIRST from BEST.',
    durationMin: 16,
    difficulty: 'Advanced',
    primaryMode: 'code-trace',
    objectives: [
      bi(
        'Thực hành quy trình phân tích câu hỏi dài trong ≤ 65 giây: luôn đọc câu chốt cuối cùng TRƯỚC khi đọc bối cảnh mở đầu',
        'Execute the 65-second anatomy workflow: read the final question sentence FIRST to filter narrative noise'
      ),
      bi(
        'Phân biệt 4 từ khóa điều hướng: FIRST/NEXT (xác minh/đánh giá bước đầu), BEST (xử lý tận gốc Root Cause), SHOULD HAVE (phòng ngừa quá khứ), NOT/EXCEPT',
        'Distinguish FIRST/NEXT (verify/assess), BEST (solve root cause), SHOULD HAVE (preventive origin), and NOT/EXCEPT'
      ),
      bi(
        'Nhận diện tín hiệu phương pháp để không áp nhầm quy trình Predictive (CCB/Baseline) sang câu Agile (PO/Backlog) hoặc ngược lại',
        'Match lifecycle vocabulary triggers (Agile vs Predictive vs Hybrid) so you never mix governance rules'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('NHỊP ĐỘ MỤC TIÊU', 'TARGET PACE'),
            value: bi('≤ 65 giây / câu hỏi', '≤ 65s / question'),
            tone: 'ok',
          },
          {
            label: bi('HỎI DO FIRST / NEXT', 'FIRST / NEXT VERB'),
            value: bi('Verify / Assess / Meet 1-1', 'Verify / Assess / Meet 1-1'),
            tone: 'ok',
          },
          {
            label: bi('HỎI DO BEST', 'BEST VERB'),
            value: bi('Trị tận gốc (Root Cause)', 'Root-cause systemic fix'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Đọc câu hỏi cuối cùng trước trong 5 giây đầu để lọc bỏ các chi tiết bối cảnh phụ ở phần mở đầu',
                    'Reversed reading order: scan the final question stem in the first 5 seconds to ignore narrative fluff'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Tách biệt trục thời gian của 4 từ khoá điều khiển: FIRST (khởi động) ≠ BEST (tận gốc) ≠ SHOULD HAVE (quá khứ)',
                      'Separated temporal intent across FIRST/NEXT, BEST, SHOULD HAVE, and NOT/EXCEPT'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '-',
                      text: bi(
                        'Loại bỏ các đáp án sai bối cảnh vòng đời (đem CCB vào Sprint Agile hoặc để PO tự sửa Scope Baseline)',
                        'Eliminated cross-lifecycle mismatches (e.g., routing Agile User Stories to CCB)'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Áp dụng 4 tiêu chí kiểm chứng cuối cùng (Pháp lý/An toàn → Trung thực → Phân tích trước → Hợp tác trực tiếp)',
                        'Verified final answer via 4-tier PMI priority funnel: Compliance/Safety -> Honesty -> Assess -> Collaborate'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Đọc tuần tự từ dòng 1 dễ làm trí nhớ bị phân tán bởi bối cảnh phụ, đến cuối mới gặp từ FIRST lại phải đọc lại từ đầu. Hãy luôn đọc câu hỏi chốt cuối cùng TRƯỚC.',
            'Reading top-down loads decoy details into memory, forcing a second read once you hit the final verb. Always read the last sentence FIRST.'
          ),
          bi(
            'Lưu ý quan trọng với từ khóa NEXT: Nếu câu áp chót viết "After assessing the impact with the team, what should the PM do NEXT?", tức bước đánh giá đã xong — lúc này cần chuyển sang bước nộp Change Request hoặc thực thi tiếp theo.',
            'Watch out for completed steps: If the prompt says "After analyzing the impact, what should the PM do NEXT?", assessment is DONE — advance to the next governance step.'
          ),
          bi(
            'Khi đề mô tả dự án Hybrid (phần cứng cố định + phần mềm Agile), cần xác định sự cố đang nằm ở nhánh nào để áp dụng đúng quy tắc của nhánh đó.',
            'In Hybrid prompts, check whether the problem sits in the Predictive hardware track (use Baseline/CCB) or the Agile software track (use PO/Backlog).'
          ),
          bi(
            'Nguyên tắc với câu hỏi phủ định: Khi gặp từ NOT / EXCEPT / LEAST, hãy tự quy đổi thành "Phương án nào SAI hoặc KHÔNG PHÙ HỢP nhất?" để tránh chọn nhầm câu đúng chuẩn PMI.',
            'Key Principle on NOT / EXCEPT questions: Mentally rephrase as "Which option violates PMI mindset?" so muscle memory does not click a good answer.'
          )
        ),
        defaultCode:
          phase === 'first'
            ? `[QUY TRÌNH 65 GIÂY PHÂN TÍCH CÂU HỎI TÌNH HUỐNG PMP]\n• 00s–08s (Bước 1) : Đọc câu chốt cuối cùng TRƯỚC -> Khoá từ khoá FIRST / NEXT / BEST / NOT.\n• 08s–20s (Bước 2) : Nhận diện phương pháp -> Agile (Sprint/PO) | Predictive (Baseline/CCB) | Hybrid.\n• 20s–40s (Bước 3) : Đọc câu áp chót -> Xác định sự cố gốc & bước PM ĐÃ LÀM XONG.\n• 40s–65s (Bước 4) : Loại 2 câu nhiễu cực đoan -> Chốt câu đúng nhịp thời gian & trao quyền.`
            : phase === 'mid1'
              ? `[4 TỪ KHOÁ ĐIỀU HƯỚNG ĐÁP ÁN]\n• do FIRST / NEXT  -> Bước khởi đầu ngay lúc đề dừng: Verify data / Assess impact / Meet 1-on-1.\n• do BEST          -> Giải pháp xử lý tận gốc (Root Cause) & ngăn tái diễn dài hạn.\n• SHOULD HAVE done -> Quay ngược quá khứ: thiếu bước phòng ngừa nào ở Initiating / Planning?\n• NOT / EXCEPT     -> Đảo ngược câu hỏi: tìm duy nhất 1 đáp án VI PHẠM chuẩn mực PMI.`
              : phase === 'mid2'
                ? `[NHẬN DIỆN BỐI CẢNH PHƯƠNG PHÁP PHÁT TRIỂN]\n• Tín hiệu Agile (Sprint, Backlog, Velocity)    -> Trao quyền Developers + PO giữ ưu tiên (Loại CCB!).\n• Tín hiệu Predictive (WBS, Baseline, CPI/SPI)  -> Phân tích tác động + PICC / CCB (Loại tự sửa ngầm!).\n• Tín hiệu Hybrid (Phần cứng + App Sprint)      -> Nhánh nào áp đúng luật nhánh nấy + khớp Milestone chung.`
                : `[PHÂN TÍCH TÌNH HUỐNG MẪU: KỸ SƯ MUỐN VIẾT LẠI MODULE TĂNG TỐC GẤP ĐÔI NHƯNG TRỄ 4 NGÀY]\n✘ A. Cho làm luôn cho khách vui       -> Sai (Gold Plating ngoài kiểm soát).\n✘ B. Trình ngay Change Request lên CCB -> Sai (Nhảy cóc khi chưa phân tích tác động).\n✘ C. Từ chối không cho xem xét        -> Sai (Cực đoan, dập tắt sáng kiến).\n✔ D. Cùng nhóm đánh giá lợi ích & tác động tổng thể trước khi quyết định lập CR -> ĐÚNG 100%!`,
      };
    },
  },

  P14: {
    id: 'P14',
    titleEn: '12 Classic Distractor Traps & Winning the Final 2-Option Tie-Breaker',
    subtitleEn:
      'Eliminate 12 toxic PMI red-flag patterns in 15 seconds and win 50/50 tie-breakers systematically.',
    durationMin: 16,
    difficulty: 'Advanced',
    primaryMode: 'code-trace',
    objectives: [
      bi(
        'Nhận diện nhanh 12 dạng đáp án nhiễu chia theo 4 nhóm (Cực đoan/Sa thải · Đẩy trách nhiệm Sponsor/HR · Thụ động/Đường tắt · Bỏ qua quy trình/Sai vai trò)',
        'Spot and eliminate 12 classic distractor patterns across 4 psychological trap families'
      ),
      bi(
        'Khắc phục 3 quán tính sai lầm phổ biến nhất của Tech Lead / BA lâu năm (đòi đổi người, đợi cuối Sprint mới gỡ Blocker, tranh luận qua email)',
        'Correct real-world Tech Lead reflexes: firing staff, delaying blocker removal to Retro, or arguing via email'
      ),
      bi(
        'Áp dụng Quy tắc 3 tầng lựa chọn khi còn 2 phương án 50/50 đều hợp lý: Trình tự thời gian → Đối thoại trực tiếp & Trao quyền → Xử lý gốc rễ hệ thống',
        'Break 50/50 ties systematically: Chronological Order -> Direct Collaboration -> Systemic Root Cause'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('LOẠI NHIỄU TỐC ĐỘ', 'FAST ELIMINATION'),
            value: bi('Gạch 2 câu bẫy trong 15s', 'Cut 2 traps in 15s'),
            tone: 'ok',
          },
          {
            label: bi('CÂN #1 (50/50)', 'TIE-BREAKER #1'),
            value: bi('Bước nào xảy ra TRƯỚC?', 'Which comes FIRST in time?'),
            tone: 'ok',
          },
          {
            label: bi('CÂN #2 & #3', 'TIE-BREAKERS #2·#3'),
            value: bi('Trực tiếp + Trị tận gốc', 'Face-to-face + Root cause'),
            tone: 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '-',
                  text: bi(
                    'Loại bỏ 12 dạng đáp án nhiễu phổ biến: sa thải nhân sự, cầu cứu Sponsor/HR vô cớ, cắt bớt kiểm thử, tự ý sửa Baseline',
                    'Filtered out all 12 toxic PMI distractor patterns in under 15 seconds'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '~',
                    text: bi(
                      'Tách rõ ranh giới: Blocker hiện tại phải gỡ NGAY TRONG NGÀY (không chờ Retro), và chỉ báo HR khi vi phạm đạo đức/pháp luật',
                      'Separated immediate daily blocker removal from Sprint Retrospectives and restricted HR escalation to legal/ethics breaches'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Áp dụng Quy tắc 3 tầng lựa chọn khi cả 2 đáp án còn lại đều lịch sự và đúng thuật ngữ PMI',
                        'Installed the 3-tier rubric to resolve 50/50 ties between two valid-looking PMI choices'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Áp dụng câu hỏi kiểm tra "Phương án nào là bước tiền đề bao quát hơn?" để chọn nhất quán phương án tối ưu',
                        'Applied the inclusion & chronology check to pick the winning answer consistently'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Các phương án nhiễu thường được viết dựa trên chính những thói quen xử lý nhanh nhưng thiếu bài bản ngoài thực tế (đẩy lên cấp trên, đổi người làm chậm, gửi email nhắc nhở chung). Nhận diện 12 dạng này giúp loại nhanh từ đầu.',
            'Wrong options mirror common corporate shortcuts (escalating prematurely, swapping devs, mass emails). Spot them and cross them out first.'
          ),
          bi(
            'Lưu ý về ranh giới xử lý tức thời và Retrospective: Môi trường Test hỏng làm đội ngừng việc hôm nay → phải gỡ Blocker ngay trong ngày, không chờ đến Sprint Retrospective cuối tuần.',
            'Timing rule: If a broken test server blocks devs today, remove the impediment TODAY — never wait until Friday’s Sprint Retrospective.'
          ),
          bi(
            'Khi còn 2 phương án 50/50 đều hợp lý: Phương án "chỉ ghi vào sổ theo dõi thụ động" hoặc "gửi email 1 chiều" luôn kém ưu tiên hơn phương án "gặp trực tiếp cùng nhóm phân tích giải quyết".',
            'In 50/50 ties, passive logging or one-way emails ALWAYS lose to proactive face-to-face team problem-solving.'
          ),
          bi(
            'Nguyên tắc chọn khi còn 2 phương án gần đúng: Câu hỏi FIRST → chọn bước diễn ra TRƯỚC (Phân tích trước khi Trình duyệt); câu hỏi BEST → chọn giải pháp sửa QUY TRÌNH GỐC (cập nhật DoR/DoD/QA) để ngăn tái diễn.',
            'Key Principle for 50/50 ties: On FIRST, pick the prerequisite step (Assess before Request); on BEST, pick the systemic safeguard (DoD/QA) that prevents recurrence.'
          )
        ),
        defaultCode:
          phase === 'first'
            ? `[4 NHÓM 12 ĐÁP ÁN NHIỄU CẦN LOẠI TRONG 15 GIÂY]\n• Nhóm 1 (Cực đoan)  : Always/Never/Halt project | Đuổi việc/Đổi người | Ép OT độc đoán.\n• Nhóm 2 (Đẩy việc)  : Cầu cứu Sponsor sớm | Đùn tranh cãi kỹ thuật sang HR | Bắt khách tự test lỗi.\n• Nhóm 3 (Đường tắt) : Chờ tuần sau/Chờ cuối Sprint | Gửi mass email lạnh lùng | Cắt test / Gold Plating.\n• Nhóm 4 (Sai luật)  : Sửa Baseline trước khi qua CCB | Tráo Risk <-> Issue | SM/PO lấn sân của Devs.`
            : phase === 'mid1'
              ? `[RANH GIỚI THẨM QUYỀN KHÔNG ĐƯỢC NHẦM]\n• Gọi HR khi nào?       -> CHỈ khi quấy rối, phân biệt đối xử, trộm cắp, vi phạm pháp luật/đạo đức.\n• Gặp Sponsor khi nào?  -> CHỈ khi vượt trần Charter / xin Management Reserve / mất khả thi Business Case.\n• Đợi Retro khi nào?    -> Cải tiến quy trình dài hạn (Còn Blocker hôm nay phải gỡ NGAY TRONG NGÀY).`
              : `[QUY TẮC 3 TẦNG KHI CÒN 2 ĐÁP ÁN ĐỀU ĐÚNG CHUẨN PMI (50/50)]\n• Tầng 1 (Thời gian) : Đánh giá tác động (Bước 1) LUÔN ƯU TIÊN HƠN Gửi Change Request (Bước 2) khi hỏi FIRST.\n• Tầng 2 (Giao tiếp) : Họp trực tiếp cùng nhóm (Interactive) LUÔN ƯU TIÊN HƠN Gửi email / Ghi sổ thụ động.\n• Tầng 3 (Chiều sâu) : Nâng cấp quy trình gốc (DoR/DoD/QA) LUÔN ƯU TIÊN HƠN Khắc phục tạm thời 1 lần khi hỏi BEST.`,
      };
    },
  },

  P15: {
    id: 'P15',
    titleEn: 'Modern Business Environment (Compliance · ADKAR · AI) & 240m Exam Strategy',
    subtitleEn:
      'Treat Compliance as #1 priority, lead adoption via 5-step ADKAR, govern GenAI safely, and master locked 3×60 exam breaks.',
    durationMin: 17,
    difficulty: 'Advanced',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Nắm vững nguyên tắc hàng đầu của Business Environment (26%): Tuân thủ luật pháp (Compliance) luôn là ưu tiên bắt buộc không trì hoãn',
        'Prioritize mandatory Regulatory Compliance above ordinary feature desires across Agile and Predictive'
      ),
      bi(
        'Dẫn dắt con người tiếp nhận hệ thống mới bằng 5 bước ADKAR (Awareness → Desire → Knowledge → Ability → Reinforcement) và quản trị AI an toàn (Human-in-the-Loop)',
        'Lead organizational adoption via the 5-step ADKAR model and enforce Responsible AI guardrails'
      ),
      bi(
        'Làm chủ nhịp đồng hồ 240 phút (240 → 160 → 80 → 0) với 2 kỳ nghỉ 10 phút khóa cố định đề tại Câu 60 và Câu 120',
        'Master 240-minute exam pacing (80m per 60-question block) and the two permanently locked 10-minute breaks'
      ),
    ],
    buildStep: (s, total) => {
      const phase = pickStepPhase(s, total);
      return {
        telemetry: [
          {
            label: bi('ƯU TIÊN PHÁP LÝ', 'COMPLIANCE'),
            value: bi('#1 Bắt buộc (Mandatory)', '#1 Mandatory Priority'),
            tone: 'ok',
          },
          {
            label: bi('CHUYỂN ĐỔI CON NGƯỜI', 'OCM ADOPTION'),
            value: bi('ADKAR (A → D → K → A → R)', 'ADKAR (5 sequential steps)'),
            tone: 'ok',
          },
          {
            label: bi('MỐC ĐỒNG HỒ THI', 'CLOCK CHECKPOINTS'),
            value: bi('C60: 160p · C120: 80p (Khoá!)', 'Q60: 160m · Q120: 80m (Locked!)'),
            tone: phase === 'mid1' ? 'warn' : 'ok',
          },
        ],
        whatChanged:
          phase === 'first'
            ? [
                {
                  op: '+',
                  text: bi(
                    'Đặt Compliance lên đỉnh ưu tiên, áp dụng 5 bậc tâm lý ADKAR chống tẩy chay hệ thống mới và giữ Human-in-the-Loop khi dùng AI',
                    'Integrated mandatory Compliance priority, 5-step ADKAR adoption, and Human-in-the-Loop AI governance'
                  ),
                },
              ]
            : phase === 'mid1'
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Chia 240 phút thành 3 chặng 80 phút (Câu 1–60 · 61–120 · 121–180), kiểm tra câu Flag trước khi bấm khoá chặng ra nghỉ!',
                      'Structured 240 minutes into three disciplined 80-minute blocks with pre-break Flag reviews'
                    ),
                  },
                ]
              : phase === 'mid2'
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Bắt buộc tận dụng trọn vẹn cả 2 kỳ nghỉ 10 phút để phục hồi sự tỉnh táo, tránh trượt về phản xạ cảm tính ở 60 câu cuối',
                        'Used both 10-minute breaks to reset cognitive stamina for the final 60 situational questions'
                      ),
                    },
                  ]
                : [
                    {
                      op: '+',
                      text: bi(
                        'Hoàn thiện lộ trình luyện đề 4 nấc tới mốc ≥ 75% trên 3 đề Full 180 câu liên tiếp — sẵn sàng chinh phục 3 Above Target!',
                        'Locked in the 4-stage mock exam ramp targeting ≥75% across 3 consecutive 180-question full tests for 3AT!'
                      ),
                    },
                  ],
        callout: makeStepCallout(
          s,
          total,
          bi(
            'Trình tự 5 bước ADKAR bắt đầu từ nhận thức: Không đưa nhân viên thẳng vào lớp đào tạo cách dùng phần mềm mới (Knowledge) khi họ chưa hiểu lý do phải thay đổi (Awareness) và chưa có động lực tham gia (Desire).',
            'ADKAR sequence: Never push staff straight into software training (Knowledge) before building Awareness of why change matters and Desire to participate.'
          ),
          bi(
            'Quy định quan trọng tại phòng thi Pearson VUE: Khi hoàn thành Câu 60 và Câu 120, ngay sau khi xác nhận sang màn hình nghỉ 10 phút, 60 câu vừa làm sẽ bị khóa vĩnh viễn và không thể quay lại chỉnh sửa.',
            'Critical Pearson VUE rule: Once you submit Q60 or Q120 to start your 10-minute break, those 60 questions are PERMANENTLY LOCKED and cannot be revisited.'
          ),
          bi(
            'Nguyên tắc quản trị AI & Bảo mật: Không đưa dữ liệu cá nhân (PII) hay tài liệu mật lên GenAI công cộng, và luôn giữ con người kiểm chứng (Human-in-the-Loop) trước mọi đề xuất của AI.',
            'AI Governance rule: Never paste confidential/PII data into public GenAI tools, and never blindly accept AI outputs without Human-in-the-Loop verification.'
          ),
          bi(
            'Nguyên tắc làm bài trong ngày thi PMP®: Trả lời đủ 100% câu hỏi (câu sai không bị trừ điểm), theo dõi mốc đồng hồ 240 → 160 → 80 → 0, và áp dụng nhất quán tư duy Servant Leader.',
            'Key Principle on Exam Day: Answer 100% of questions (no penalty for wrong guesses), hit clock checkpoints 160m & 80m, and think like a principled Servant Leader.'
          )
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'ADKAR (5 Bước Chuyển đổi) & Nhịp Đồng hồ 240 Phút (3 Chặng Khóa Đề)',
            '5-Step ADKAR Change Adoption & 240-Minute 3-Block Pacing'
          ),
          subtitle: bi(
            'Sau Câu 60 và Câu 120: bấm nghỉ 10 phút sẽ KHÓA VĨNH VIỄN 60 câu vừa làm!',
            'Submitting Q60 and Q120 for 10-minute breaks PERMANENTLY LOCKS previous blocks!'
          ),
          cells:
            phase === 'first'
              ? ['Awareness', 'Desire', 'Knowledge', 'Ability', 'Reinforce']
              : ['Q1–60 (80p)', 'Nghỉ 10p 🔒', 'Q61–120 (80p)', 'Nghỉ 10p 🔒', 'Q121–180 (80p)'],
          activeIndices:
            phase === 'first'
              ? [0, 1]
              : phase === 'mid1'
                ? [0, 1, 2]
                : phase === 'mid2'
                  ? [1, 3, 4]
                  : [0, 2, 4],
          pointers:
            phase === 'first'
              ? [{ index: 0, label: 'Hiểu VÌ SAO trước khi đào tạo!', tone: 'orange' }]
              : phase === 'mid1'
                ? [{ index: 1, label: 'Mốc đồng hồ: còn 160p', tone: 'rose' }]
                : phase === 'mid2'
                  ? [{ index: 3, label: 'Mốc đồng hồ: còn 80p', tone: 'purple' }]
                  : [{ index: 4, label: 'Trả lời đủ 180/180 câu!', tone: 'green' }],
          outputPill: {
            label: bi('Ưu tiên số 1', '#1 Priority'),
            value: bi('Compliance bắt buộc > Tính năng thường · Không dán PII lên AI công cộng', 'Mandatory Compliance #1 · Zero PII on public GenAI'),
            tone: 'green',
          },
        },
        defaultCode: `[BUSINESS ENVIRONMENT 26% & EXAM DAY PACING]\n• Regulatory Compliance : #1 Mandatory -> Top of Backlog (Agile) or Mandatory CR to CCB (Predictive).\n• ADKAR Change Model    : Awareness -> Desire -> Knowledge -> Ability -> Reinforcement.\n• AI Governance         : Zero PII on public AI + check Bias/Hallucinations + Human-in-the-Loop.\n• 240-Min Clock Pacing  : Block 1 (240->160m) [LOCKED BREAK] Block 2 (160->80m) [LOCKED BREAK] Block 3 (80->0m).`,
      };
    },
  },
};
