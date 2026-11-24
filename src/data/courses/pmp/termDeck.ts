export type PmpTermAreaId =
  | 'framework'
  | 'business-env'
  | 'integration'
  | 'scope'
  | 'schedule'
  | 'cost'
  | 'quality'
  | 'resource'
  | 'communications'
  | 'stakeholders'
  | 'risk'
  | 'procurement'
  | 'agile';

export interface PmpBookTermCard {
  id: string;
  area: PmpTermAreaId;
  subtopic: string;
  term: string;
  viTerm: string;
  definition: string;
  compareWith?: string[];
}

export const PMP_TERM_AREAS: Array<{
  id: PmpTermAreaId;
  labelVi: string;
  labelEn: string;
}> = [
  { id: 'framework', labelVi: 'Framework', labelEn: 'Framework' },
  { id: 'business-env', labelVi: 'Business Env', labelEn: 'Business Environment' },
  { id: 'integration', labelVi: 'Integration', labelEn: 'Integration' },
  { id: 'scope', labelVi: 'Scope', labelEn: 'Scope' },
  { id: 'schedule', labelVi: 'Schedule', labelEn: 'Schedule' },
  { id: 'cost', labelVi: 'Cost', labelEn: 'Cost' },
  { id: 'quality', labelVi: 'Quality', labelEn: 'Quality' },
  { id: 'resource', labelVi: 'Resource', labelEn: 'Resource' },
  { id: 'communications', labelVi: 'Communications', labelEn: 'Communications' },
  { id: 'stakeholders', labelVi: 'Stakeholders', labelEn: 'Stakeholders' },
  { id: 'risk', labelVi: 'Risk', labelEn: 'Risk' },
  { id: 'procurement', labelVi: 'Procurement', labelEn: 'Procurement' },
  { id: 'agile', labelVi: 'Agile & Hybrid', labelEn: 'Agile & Hybrid' },
];

export const PMP_BOOK_TERM_DECK: PmpBookTermCard[] = [
  // 1. FRAMEWORK (8 cards · 2 groups)
  {
    id: 'fw-1',
    area: 'framework',
    subtopic: 'Value Delivery Hierarchy',
    term: 'Portfolio',
    viTerm: 'Danh mục đầu tư',
    definition:
      'Tập hợp các chương trình, dự án và vận hành được quản lý tập trung để đạt mục tiêu chiến lược của tổ chức.',
    compareWith: ['Program', 'Project', 'Operations'],
  },
  {
    id: 'fw-2',
    area: 'framework',
    subtopic: 'Value Delivery Hierarchy',
    term: 'Program',
    viTerm: 'Chương trình dự án',
    definition:
      'Nhóm các dự án liên quan được điều phối chung nhằm tạo ra lợi ích tổng hợp mà quản lý riêng lẻ không đạt được.',
    compareWith: ['Portfolio', 'Project'],
  },
  {
    id: 'fw-3',
    area: 'framework',
    subtopic: 'Value Delivery Hierarchy',
    term: 'Project',
    viTerm: 'Dự án',
    definition:
      'Nỗ lực tạm thời (có điểm đầu và điểm cuối xác định) nhằm tạo ra một sản phẩm, dịch vụ hoặc kết quả duy nhất.',
    compareWith: ['Operations', 'Program'],
  },
  {
    id: 'fw-4',
    area: 'framework',
    subtopic: 'Value Delivery Hierarchy',
    term: 'Operations',
    viTerm: 'Vận hành thường xuyên',
    definition:
      'Hoạt động liên tục, lặp đi lặp lại để duy trì doanh nghiệp và tạo giá trị ổn định (nằm ngoài phạm vi tạm thời của dự án).',
    compareWith: ['Project', 'Portfolio'],
  },
  {
    id: 'fw-5',
    area: 'framework',
    subtopic: 'PMO & Governance',
    term: 'Supportive PMO',
    viTerm: 'PMO Hỗ trợ',
    definition:
      'Đóng vai trò tư vấn, cung cấp biểu mẫu, bài học kinh nghiệm và chuẩn thực hành tốt; mức độ kiểm soát thấp.',
    compareWith: ['Controlling PMO', 'Directive PMO'],
  },
  {
    id: 'fw-6',
    area: 'framework',
    subtopic: 'PMO & Governance',
    term: 'Controlling PMO',
    viTerm: 'PMO Kiểm soát',
    definition:
      'Yêu cầu tuân thủ quy trình, khung quản trị, biểu mẫu hoặc công cụ chuẩn; mức độ kiểm soát trung bình.',
    compareWith: ['Supportive PMO', 'Directive PMO'],
  },
  {
    id: 'fw-7',
    area: 'framework',
    subtopic: 'PMO & Governance',
    term: 'Directive PMO',
    viTerm: 'PMO Chỉ đạo trực tiếp',
    definition:
      'Trực tiếp tiếp quản và điều hành dự án bằng cách phân công PM thuộc PMO; mức độ kiểm soát cao nhất.',
    compareWith: ['Supportive PMO', 'Controlling PMO'],
  },
  {
    id: 'fw-8',
    area: 'framework',
    subtopic: 'PMO & Governance',
    term: 'Tailoring',
    viTerm: 'May đo quy trình',
    definition:
      'Điều chỉnh có chủ đích phương pháp, quy trình, tài liệu và công cụ quản lý cho phù hợp bối cảnh, quy mô và độ rủi ro của từng dự án.',
    compareWith: ['Methodology', 'Governance'],
  },

  // 2. BUSINESS ENVIRONMENT (8 cards · 2 groups)
  {
    id: 'be-1',
    area: 'business-env',
    subtopic: 'Initiation & Benefits',
    term: 'Business Case',
    viTerm: 'Luận chứng kinh doanh',
    definition:
      'Tài liệu phân tích chi phí – lợi ích kinh tế để chứng minh dự án có đáng đầu tư hay không; là đầu vào tạo Project Charter.',
    compareWith: ['Benefits Management Plan', 'Project Charter'],
  },
  {
    id: 'be-2',
    area: 'business-env',
    subtopic: 'Initiation & Benefits',
    term: 'Benefits Management Plan',
    viTerm: 'Kế hoạch quản lý lợi ích',
    definition:
      'Xác định các lợi ích mục tiêu, thước đo KPI, chủ sở hữu lợi ích và lộ trình hiện thực hóa giá trị sau khi bàn giao.',
    compareWith: ['Business Case', 'Net Present Value (NPV)'],
  },
  {
    id: 'be-3',
    area: 'business-env',
    subtopic: 'Initiation & Benefits',
    term: 'Net Present Value (NPV)',
    viTerm: 'Giá trị hiện tại ròng',
    definition:
      'Tổng dòng tiền tương lai quy về hiện tại trừ đi chi phí đầu tư ban đầu; dự án có NPV > 0 và cao hơn thường được ưu tiên.',
    compareWith: ['IRR', 'Payback Period', 'BCR'],
  },
  {
    id: 'be-4',
    area: 'business-env',
    subtopic: 'Initiation & Benefits',
    term: 'Compliance & Regulatory',
    viTerm: 'Tuân thủ pháp lý & quy chuẩn',
    definition:
      'Các yêu cầu bắt buộc từ luật pháp, tiêu chuẩn ngành, bảo mật dữ liệu hoặc an toàn; vi phạm có thể làm dự án bị đình chỉ ngay.',
    compareWith: ['ESG', 'OCM'],
  },
  {
    id: 'be-5',
    area: 'business-env',
    subtopic: 'Organizational Change & Context',
    term: 'Organizational Change Management (OCM)',
    viTerm: 'Quản trị thay đổi tổ chức',
    definition:
      'Quy trình có cấu trúc giúp con người và tổ chức sẵn sàng thích nghi, đào tạo và chấp nhận sản phẩm/cách làm việc mới.',
    compareWith: ['Stakeholder Engagement', 'ADKAR'],
  },
  {
    id: 'be-6',
    area: 'business-env',
    subtopic: 'Organizational Change & Context',
    term: 'Enterprise Environmental Factors (EEFs)',
    viTerm: 'Yếu tố môi trường doanh nghiệp',
    definition:
      'Điều kiện nội bộ hoặc bên ngoài nằm ngoài tầm kiểm soát trực tiếp của nhóm dự án (văn hóa công ty, luật pháp, hạ tầng sẵn có, thị trường).',
    compareWith: ['OPAs'],
  },
  {
    id: 'be-7',
    area: 'business-env',
    subtopic: 'Organizational Change & Context',
    term: 'Organizational Process Assets (OPAs)',
    viTerm: 'Tài sản quy trình tổ chức',
    definition:
      'Quy trình, chính sách, biểu mẫu, dữ liệu lịch sử và bài học kinh nghiệm (Lessons Learned) do tổ chức tích lũy để tái sử dụng.',
    compareWith: ['EEFs', 'Lessons Learned Register'],
  },
  {
    id: 'be-8',
    area: 'business-env',
    subtopic: 'Organizational Change & Context',
    term: 'Minimum Viable Product (MVP)',
    viTerm: 'Sản phẩm khả dụng tối thiểu',
    definition:
      'Phiên bản nhỏ nhất có đủ tính năng cốt lõi để phát hành sớm cho người dùng thật nhằm kiểm chứng giả thuyết và thu phản hồi.',
    compareWith: ['MMF', 'Incremental Delivery'],
  },

  // 3. INTEGRATION (8 cards · 2 groups)
  {
    id: 'int-1',
    area: 'integration',
    subtopic: 'Charters, Plans & Change Control',
    term: 'Project Charter',
    viTerm: 'Điều lệ dự án',
    definition:
      'Tài liệu do Sponsor phát hành chính thức khai sinh dự án và trao thẩm quyền cho PM sử dụng nguồn lực tổ chức.',
    compareWith: ['Project Management Plan', 'Scope Statement'],
  },
  {
    id: 'int-2',
    area: 'integration',
    subtopic: 'Charters, Plans & Change Control',
    term: 'Project Management Plan',
    viTerm: 'Kế hoạch quản lý dự án',
    definition:
      'Tài liệu tổng hợp (gồm các kế hoạch thành phần và 3 đường cơ sở Scope/Schedule/Cost) quy định cách thực thi, giám sát và đóng dự án.',
    compareWith: ['Project Charter', 'Baseline'],
  },
  {
    id: 'int-3',
    area: 'integration',
    subtopic: 'Charters, Plans & Change Control',
    term: 'Change Control Board (CCB)',
    viTerm: 'Hội đồng kiểm soát thay đổi',
    definition:
      'Nhóm có thẩm quyền chính thức xem xét, phê duyệt hoặc từ chối các yêu cầu thay đổi (Change Request) ảnh hưởng đến đường cơ sở.',
    compareWith: ['Perform Integrated Change Control', 'Configuration Management'],
  },
  {
    id: 'int-4',
    area: 'integration',
    subtopic: 'Charters, Plans & Change Control',
    term: 'Assumption Log',
    viTerm: 'Nhật ký giả định & ràng buộc',
    definition:
      'Ghi lại mọi giả định (điều tạm coi là đúng khi lập kế hoạch) và ràng buộc chiến lược ngay từ lúc khởi tạo xuyên suốt dự án.',
    compareWith: ['Risk Register', 'Issue Log'],
  },
  {
    id: 'int-5',
    area: 'integration',
    subtopic: 'Knowledge & Closure',
    term: 'Explicit Knowledge',
    viTerm: 'Tri thức hiện',
    definition:
      'Kiến thức dễ dàng ghi chép, hệ thống hóa bằng văn bản, tài liệu, sơ đồ hoặc công thức để chia sẻ rộng rãi.',
    compareWith: ['Tacit Knowledge'],
  },
  {
    id: 'int-6',
    area: 'integration',
    subtopic: 'Knowledge & Closure',
    term: 'Tacit Knowledge',
    viTerm: 'Tri thức ẩn',
    definition:
      'Kinh nghiệm cá nhân, trực giác và bí quyết khó viết thành lời; cần truyền đạt qua cặp đôi (shadowing), workshop hoặc trò chuyện trực tiếp.',
    compareWith: ['Explicit Knowledge'],
  },
  {
    id: 'int-7',
    area: 'integration',
    subtopic: 'Knowledge & Closure',
    term: 'Lessons Learned Register',
    viTerm: 'Sổ bài học kinh nghiệm',
    definition:
      'Tài liệu sống được cập nhật liên tục trong suốt dự án (không đợi đến cuối dự án) để ghi nhận điều làm tốt và điều cần cải thiện.',
    compareWith: ['OPAs', 'Retrospective'],
  },
  {
    id: 'int-8',
    area: 'integration',
    subtopic: 'Knowledge & Closure',
    term: 'Administrative Closure',
    viTerm: 'Đóng dự án hành chính',
    definition:
      'Hoàn tất xác nhận bàn giao, giải phóng đội ngũ, đóng hợp đồng, lưu trữ hồ sơ vào OPAs và lập báo cáo tổng kết cuối dự án.',
    compareWith: ['Validate Scope', 'Procurement Closure'],
  },

  // 4. SCOPE (8 cards · 2 groups)
  {
    id: 'scp-1',
    area: 'scope',
    subtopic: 'Scope Definition & WBS',
    term: 'Work Breakdown Structure (WBS)',
    viTerm: 'Cấu trúc phân rã công việc',
    definition:
      'Cây phân cấp theo sản phẩm bàn giao (deliverable-oriented) chia nhỏ 100% phạm vi dự án xuống tới cấp Work Package.',
    compareWith: ['WBS Dictionary', 'Scope Baseline'],
  },
  {
    id: 'scp-2',
    area: 'scope',
    subtopic: 'Scope Definition & WBS',
    term: '100% Rule',
    viTerm: 'Quy tắc 100%',
    definition:
      'WBS phải bao phủ trọn vẹn 100% công việc nằm trong phạm vi dự án — không thiếu sản phẩm cần làm và không chứa việc ngoài phạm vi.',
    compareWith: ['WBS', 'Gold Plating'],
  },
  {
    id: 'scp-3',
    area: 'scope',
    subtopic: 'Scope Definition & WBS',
    term: 'Scope Creep',
    viTerm: 'Trượt phạm vi',
    definition:
      'Việc bổ sung thêm tính năng/yêu cầu một cách tự phát mà không qua đánh giá tác động và quy trình kiểm soát thay đổi chính thức.',
    compareWith: ['Gold Plating', 'CCB'],
  },
  {
    id: 'scp-4',
    area: 'scope',
    subtopic: 'Scope Definition & WBS',
    term: 'Gold Plating',
    viTerm: 'Mạ vàng tính năng',
    definition:
      'Nhóm kỹ thuật tự ý làm thêm tính năng ngoài yêu cầu để "làm vui lòng khách" nhưng làm tăng rủi ro, chi phí và trễ tiến độ.',
    compareWith: ['Scope Creep', '100% Rule'],
  },
  {
    id: 'scp-5',
    area: 'scope',
    subtopic: 'Deliverable Acceptance Flow',
    term: 'Requirements Traceability Matrix (RTM)',
    viTerm: 'Ma trận truy xuất yêu cầu',
    definition:
      'Bảng liên kết từng yêu cầu từ nguồn gốc kinh doanh tới mục tiêu WBS, thiết kế và ca kiểm thử nghiệm thu cuối cùng.',
    compareWith: ['Scope Statement', 'Validate Scope'],
  },
  {
    id: 'scp-6',
    area: 'scope',
    subtopic: 'Deliverable Acceptance Flow',
    term: 'Control Quality',
    viTerm: 'Kiểm soát chất lượng (QC)',
    definition:
      'Đội nội bộ kiểm tra, đo lường sản phẩm thô để biến thành Verified Deliverable (đạt chuẩn kỹ thuật) trước khi trình khách hàng.',
    compareWith: ['Validate Scope', 'Quality Assurance'],
  },
  {
    id: 'scp-7',
    area: 'scope',
    subtopic: 'Deliverable Acceptance Flow',
    term: 'Validate Scope',
    viTerm: 'Nghiệm thu phạm vi',
    definition:
      'Khách hàng hoặc Sponsor chính thức rà soát Verified Deliverable và ký biên bản chấp nhận (Accepted Deliverable).',
    compareWith: ['Control Quality', 'Administrative Closure'],
  },
  {
    id: 'scp-8',
    area: 'scope',
    subtopic: 'Deliverable Acceptance Flow',
    term: 'Decomposition',
    viTerm: 'Kỹ thuật phân rã',
    definition:
      'Chia nhỏ phạm vi thành các gói công việc (Work Package) đủ nhỏ để ước lượng chính xác thời gian, chi phí và gán trách nhiệm.',
    compareWith: ['WBS', 'Rolling Wave Planning'],
  },

  // 5. SCHEDULE (8 cards · 2 groups)
  {
    id: 'sch-1',
    area: 'schedule',
    subtopic: 'Critical Path & Float',
    term: 'Critical Path Method (CPM)',
    viTerm: 'Phương pháp đường găng',
    definition:
      'Chuỗi công việc dài nhất trong mạng tiến độ quyết định thời gian hoàn thành tối thiểu của toàn dự án; Total Float bằng 0.',
    compareWith: ['Total Float', 'Free Float'],
  },
  {
    id: 'sch-2',
    area: 'schedule',
    subtopic: 'Critical Path & Float',
    term: 'Total Float (Slack)',
    viTerm: 'Thời gian dự trữ tổng',
    definition:
      'Số ngày tối đa một công việc có thể bị trễ mà không làm trễ ngày kết thúc chung của toàn dự án (LS − ES).',
    compareWith: ['Free Float', 'Critical Path Method (CPM)'],
  },
  {
    id: 'sch-3',
    area: 'schedule',
    subtopic: 'Critical Path & Float',
    term: 'Free Float',
    viTerm: 'Thời gian dự trữ tự do',
    definition:
      'Số ngày một công việc có thể trễ mà không làm chậm ngày bắt đầu sớm (ES) của công việc kế tiếp ngay sau nó.',
    compareWith: ['Total Float (Slack)'],
  },
  {
    id: 'sch-4',
    area: 'schedule',
    subtopic: 'Critical Path & Float',
    term: 'Rolling Wave Planning',
    viTerm: 'Hoạch định cuốn chiếu',
    definition:
      'Lập kế hoạch chi tiết cho các việc trước mắt trong ngắn hạn, còn công việc xa hơn giữ ở mức tổng quan rồi chi tiết hóa dần.',
    compareWith: ['Progressive Elaboration', 'Backlog Refinement'],
  },
  {
    id: 'sch-5',
    area: 'schedule',
    subtopic: 'Schedule Compression & Dependencies',
    term: 'Crashing',
    viTerm: 'Rút ngắn bằng tăng nguồn lực',
    definition:
      'Thêm người, tăng ca hoặc chi tiền cho các việc trên Đường găng để rút ngắn tiến độ — luôn làm tăng chi phí.',
    compareWith: ['Fast Tracking', 'Resource Leveling'],
  },
  {
    id: 'sch-6',
    area: 'schedule',
    subtopic: 'Schedule Compression & Dependencies',
    term: 'Fast Tracking',
    viTerm: 'Chạy song song các khâu',
    definition:
      'Cho các giai đoạn vốn làm tuần tự chạy gối đầu/song song trên Đường găng để rút ngắn thời gian — làm tăng rủi ro phải làm lại (rework).',
    compareWith: ['Crashing'],
  },
  {
    id: 'sch-7',
    area: 'schedule',
    subtopic: 'Schedule Compression & Dependencies',
    term: 'Resource Leveling',
    viTerm: 'Cân bằng tải nguồn lực',
    definition:
      'Điều chỉnh ngày bắt đầu/kết thúc công việc để giải quyết quá tải nhân sự (ví dụ 1 người bị gán 16h/ngày); thường kéo dài Đường găng.',
    compareWith: ['Resource Smoothing'],
  },
  {
    id: 'sch-8',
    area: 'schedule',
    subtopic: 'Schedule Compression & Dependencies',
    term: 'Resource Smoothing',
    viTerm: 'Làm mượt nguồn lực',
    definition:
      'Điều chỉnh công việc nhưng CHỈ trong phạm vi Free/Total Float sẵn có nên không làm thay đổi Đường găng hay ngày kết thúc dự án.',
    compareWith: ['Resource Leveling'],
  },

  // 6. COST & EVM (8 cards · 2 groups)
  {
    id: 'cst-1',
    area: 'cost',
    subtopic: 'Budget & Reserves',
    term: 'Contingency Reserve',
    viTerm: 'Quỹ dự phòng phát sinh',
    definition:
      'Ngân sách/thời gian dành cho rủi ro ĐÃ nhận diện (Known-Unknowns); nằm TRONG Cost Baseline và do PM chủ động quản lý.',
    compareWith: ['Management Reserve', 'Cost Baseline'],
  },
  {
    id: 'cst-2',
    area: 'cost',
    subtopic: 'Budget & Reserves',
    term: 'Management Reserve',
    viTerm: 'Quỹ dự phòng quản lý',
    definition:
      'Ngân sách cho rủi ro CHƯA lường trước (Unknown-Unknowns); nằm NGOÀI Cost Baseline (nhưng trong Project Budget), cần Sponsor duyệt mới được dùng.',
    compareWith: ['Contingency Reserve', 'Cost Baseline'],
  },
  {
    id: 'cst-3',
    area: 'cost',
    subtopic: 'Budget & Reserves',
    term: 'Cost Baseline',
    viTerm: 'Đường cơ sở chi phí',
    definition:
      'Ngân sách theo phân kỳ thời gian được phê duyệt (bao gồm chi phí ước lượng + Contingency Reserve), dùng làm chuẩn đo lường EVM.',
    compareWith: ['Management Reserve', 'Funding Limit Reconciliation'],
  },
  {
    id: 'cst-4',
    area: 'cost',
    subtopic: 'Budget & Reserves',
    term: 'Funding Limit Reconciliation',
    viTerm: 'Đối soát giới hạn cấp vốn',
    definition:
      'So khớp kế hoạch chi tiêu với trần giải ngân theo từng quý/năm; nếu vượt trần phải giãn tiến độ một số hạng mục.',
    compareWith: ['Cost Baseline', 'Cost Aggregation'],
  },
  {
    id: 'cst-5',
    area: 'cost',
    subtopic: 'Earned Value Management (EVM)',
    term: 'CPI (Cost Performance Index)',
    viTerm: 'Chỉ số hiệu suất chi phí',
    definition:
      'CPI = EV / AC. CPI < 1 nghĩa là đang vượt ngân sách (chi nhiều hơn giá trị tạo ra); CPI > 1 là tiết kiệm chi phí.',
    compareWith: ['SPI', 'EAC', 'TCPI'],
  },
  {
    id: 'cst-6',
    area: 'cost',
    subtopic: 'Earned Value Management (EVM)',
    term: 'SPI (Schedule Performance Index)',
    viTerm: 'Chỉ số hiệu suất tiến độ',
    definition:
      'SPI = EV / PV. SPI < 1 nghĩa là đang chậm tiến độ so với kế hoạch; SPI > 1 là vượt tiến độ.',
    compareWith: ['CPI', 'SV'],
  },
  {
    id: 'cst-7',
    area: 'cost',
    subtopic: 'Earned Value Management (EVM)',
    term: 'Estimate at Completion (EAC)',
    viTerm: 'Ước tính tổng chi phí khi xong',
    definition:
      'Dự báo tổng chi phí cuối cùng của dự án dựa trên hiệu suất thực tế hiện tại (công thức chuẩn nếu xu hướng CPI tiếp diễn: BAC / CPI).',
    compareWith: ['ETC', 'VAC', 'BAC'],
  },
  {
    id: 'cst-8',
    area: 'cost',
    subtopic: 'Earned Value Management (EVM)',
    term: 'TCPI (To-Complete Performance Index)',
    viTerm: 'Chỉ số hiệu suất cần đạt còn lại',
    definition:
      'Mức hiệu suất chi phí phải đạt trên phần việc còn lại ((BAC − EV) / (BAC − AC)) để hoàn thành đúng ngân sách gốc.',
    compareWith: ['CPI', 'EAC'],
  },

  // 7. QUALITY (8 cards · 2 groups)
  {
    id: 'ql-1',
    area: 'quality',
    subtopic: 'QA vs QC & Prevention',
    term: 'Quality Assurance (Manage Quality)',
    viTerm: 'Đảm bảo chất lượng (QA)',
    definition:
      'Tập trung vào QUY TRÌNH phòng ngừa lỗi (audit quy trình, chuẩn hóa checklist) để tạo niềm tin rằng sản phẩm làm ra sẽ đạt chất lượng.',
    compareWith: ['Quality Control (QC)', 'Prevention over Inspection'],
  },
  {
    id: 'ql-2',
    area: 'quality',
    subtopic: 'QA vs QC & Prevention',
    term: 'Quality Control (QC)',
    viTerm: 'Kiểm soát chất lượng (QC)',
    definition:
      'Tập trung vào SẢN PHẨM đầu ra bằng cách kiểm thử, đo đạc và bắt lỗi trước khi giao cho khách hàng.',
    compareWith: ['Quality Assurance', 'Validate Scope'],
  },
  {
    id: 'ql-3',
    area: 'quality',
    subtopic: 'QA vs QC & Prevention',
    term: 'Prevention over Inspection',
    viTerm: 'Phòng ngừa hơn kiểm tra',
    definition:
      'Nguyên tắc vàng của PMI: chi phí ngăn ngừa lỗi ngay từ thiết kế luôn rẻ hơn nhiều so với chi phí tìm và sửa lỗi sau khi làm xong.',
    compareWith: ['Cost of Quality (COQ)'],
  },
  {
    id: 'ql-4',
    area: 'quality',
    subtopic: 'QA vs QC & Prevention',
    term: 'Cost of Quality (COQ)',
    viTerm: 'Chi phí chất lượng',
    definition:
      'Tổng chi phí Tuân thủ (đào tạo, kiểm thử phòng lỗi) + chi phí Không tuân thủ (làm lại nội bộ, bảo hành/đền bù bên ngoài).',
    compareWith: ['Prevention over Inspection'],
  },
  {
    id: 'ql-5',
    area: 'quality',
    subtopic: 'Quality Tools & Metrics',
    term: 'Ishikawa (Fishbone) Diagram',
    viTerm: 'Biểu đồ xương cá',
    definition:
      'Công cụ phân tích nguyên nhân gốc rễ (Root Cause Analysis) bằng cách nhóm các yếu tố Con người, Quy trình, Công cụ, Môi trường.',
    compareWith: ['Pareto Chart', '5 Whys'],
  },
  {
    id: 'ql-6',
    area: 'quality',
    subtopic: 'Quality Tools & Metrics',
    term: 'Pareto Chart (80/20)',
    viTerm: 'Biểu đồ Pareto',
    definition:
      'Biểu đồ cột sắp xếp theo tần suất giảm dần giúp xác định 20% nguyên nhân trọng yếu gây ra 80% số lỗi.',
    compareWith: ['Ishikawa Diagram', 'Control Chart'],
  },
  {
    id: 'ql-7',
    area: 'quality',
    subtopic: 'Quality Tools & Metrics',
    term: 'Control Chart (Rule of 7)',
    viTerm: 'Biểu đồ kiểm soát',
    definition:
      'Theo dõi độ ổn định quy trình qua giới hạn kiểm soát trên/dưới (UCL/LCL); 7 điểm liên tiếp nằm một phía trung bình báo hiệu mất kiểm soát.',
    compareWith: ['Specification Limits'],
  },
  {
    id: 'ql-8',
    area: 'quality',
    subtopic: 'Quality Tools & Metrics',
    term: 'Grade vs Quality',
    viTerm: 'Cấp bậc sản phẩm vs Chất lượng',
    definition:
      'Quality là đáp ứng yêu cầu (bắt buộc luôn cao); Grade là hạng tính năng (ví dụ bản Tiêu chuẩn ít tính năng nhưng ít lỗi vẫn là Quality cao).',
    compareWith: ['Quality Control (QC)'],
  },

  // 8. RESOURCE (8 cards · 2 groups)
  {
    id: 'res-1',
    area: 'resource',
    subtopic: 'Team Development & Conflict',
    term: 'Tuckman Ladder',
    viTerm: 'Thang phát triển nhóm Tuckman',
    definition:
      '5 giai đoạn phát triển đội nhóm: Forming → Storming → Norming → Performing → Adjourning (mỗi khi có người mới có thể lùi lại bước).',
    compareWith: ['Team Charter'],
  },
  {
    id: 'res-2',
    area: 'resource',
    subtopic: 'Team Development & Conflict',
    term: 'Collaborate / Problem Solve',
    viTerm: 'Hợp tác giải quyết vấn đề',
    definition:
      'Cách giải quyết xung đột tối ưu theo PMI (Win–Win): cùng phân tích dữ liệu đa góc nhìn để tìm đồng thuận bền vững.',
    compareWith: ['Compromise', 'Smooth / Accommodate', 'Force / Direct'],
  },
  {
    id: 'res-3',
    area: 'resource',
    subtopic: 'Team Development & Conflict',
    term: 'Compromise / Reconcile',
    viTerm: 'Thỏa hiệp nhượng bộ',
    definition:
      'Mỗi bên nhường một phần để giải quyết tạm thời (Lose–Lose hoặc Win-một-nửa) khi cần quyết định nhanh và không ai thắng tuyệt đối.',
    compareWith: ['Collaborate / Problem Solve'],
  },
  {
    id: 'res-4',
    area: 'resource',
    subtopic: 'Team Development & Conflict',
    term: 'Servant Leadership',
    viTerm: 'Lãnh đạo phục vụ',
    definition:
      'Phong cách lãnh đạo đặt đội ngũ lên trước: gỡ bỏ rào cản (impediments), bảo vệ nhóm khỏi nhiễu và tạo điều kiện tự chủ.',
    compareWith: ['Emotional Intelligence', 'Team Charter'],
  },
  {
    id: 'res-5',
    area: 'resource',
    subtopic: 'Responsibility & Incentives',
    term: 'RACI Matrix',
    viTerm: 'Ma trận trách nhiệm RACI',
    definition:
      'Phân rõ vai trò cho từng đầu việc: Responsible (Làm), Accountable (Chịu trách nhiệm cuối — đúng 1 người), Consulted, Informed.',
    compareWith: ['Resource Breakdown Structure'],
  },
  {
    id: 'res-6',
    area: 'resource',
    subtopic: 'Responsibility & Incentives',
    term: 'Team Charter',
    viTerm: 'Hiến chương đội nhóm',
    definition:
      'Thỏa thuận chung do chính thành viên lập về quy tắc ứng xử, giờ họp, cách xử lý xung đột và ra quyết định.',
    compareWith: ['Project Charter', 'Working Agreements'],
  },
  {
    id: 'res-7',
    area: 'resource',
    subtopic: 'Responsibility & Incentives',
    term: 'Halo Effect',
    viTerm: 'Hiệu ứng hào quang',
    definition:
      'Thiên kiến đánh giá: thăng chức một kỹ sư xuất sắc lên làm PM vì mặc định giỏi chuyên môn thì cũng sẽ giỏi quản lý.',
    compareWith: ['Expectancy Theory', 'Maslow Hierarchy'],
  },
  {
    id: 'res-8',
    area: 'resource',
    subtopic: 'Responsibility & Incentives',
    term: 'Emotional Intelligence (EQ)',
    viTerm: 'Trí tuệ cảm xúc',
    definition:
      'Khả năng nhận diện và điều tiết cảm xúc bản thân, đồng cảm với thành viên và stakeholder để dẫn dắt hiệu quả trong xung đột.',
    compareWith: ['Servant Leadership'],
  },

  // 9. COMMUNICATIONS (4 cards · 1 group)
  {
    id: 'com-1',
    area: 'communications',
    subtopic: 'Communication Methods & Channels',
    term: 'Interactive Communication',
    viTerm: 'Giao tiếp tương tác hai chiều',
    definition:
      'Trao đổi đa chiều theo thời gian thực (họp trực tiếp, gọi video, workshop) — hiệu quả nhất cho vấn đề phức tạp hoặc nhạy cảm.',
    compareWith: ['Push Communication', 'Pull Communication'],
  },
  {
    id: 'com-2',
    area: 'communications',
    subtopic: 'Communication Methods & Channels',
    term: 'Push Communication',
    viTerm: 'Giao tiếp đẩy một chiều',
    definition:
      'Gửi thông tin trực tiếp tới người nhận (email, báo cáo tuần, Slack) — đảm bảo đã gửi đi nhưng chưa chắc họ đã đọc hay hiểu.',
    compareWith: ['Interactive Communication', 'Pull Communication'],
  },
  {
    id: 'com-3',
    area: 'communications',
    subtopic: 'Communication Methods & Channels',
    term: 'Pull Communication',
    viTerm: 'Giao tiếp tự tra cứu',
    definition:
      'Đặt tài liệu khối lượng lớn lên kho chung (Confluence, SharePoint, wiki) để người cần tự chủ động vào xem.',
    compareWith: ['Push Communication'],
  },
  {
    id: 'com-4',
    area: 'communications',
    subtopic: 'Communication Methods & Channels',
    term: 'Communication Channels N(N−1)/2',
    viTerm: 'Số kênh giao tiếp',
    definition:
      'Công thức tính số đường truyền thông tin giữa N người; thêm 1 thành viên làm số kênh giao tiếp tăng theo cấp số nhân.',
    compareWith: ['Communications Management Plan'],
  },

  // 10. STAKEHOLDERS (4 cards · 1 group)
  {
    id: 'stk-1',
    area: 'stakeholders',
    subtopic: 'Stakeholder Analysis & Engagement',
    term: 'Power / Interest Grid',
    viTerm: 'Ma trận Quyền lực / Quan tâm',
    definition:
      'Phân loại Stakeholder thành 4 nhóm: Manage Closely (Cao/Cao), Keep Satisfied (Cao/Thấp), Keep Informed (Thấp/Cao), Monitor (Thấp/Thấp).',
    compareWith: ['Salience Model', 'Engagement Assessment Matrix'],
  },
  {
    id: 'stk-2',
    area: 'stakeholders',
    subtopic: 'Stakeholder Analysis & Engagement',
    term: 'Stakeholder Register',
    viTerm: 'Sổ đăng ký bên liên quan',
    definition:
      'Danh sách nhận diện các bên liên quan, vai trò, kỳ vọng, mức ảnh hưởng và chiến lược tiếp cận; cần rà soát liên tục.',
    compareWith: ['Stakeholder Engagement Plan'],
  },
  {
    id: 'stk-3',
    area: 'stakeholders',
    subtopic: 'Stakeholder Analysis & Engagement',
    term: 'Engagement Assessment Matrix',
    viTerm: 'Ma trận mức độ gắn kết',
    definition:
      'So sánh trạng thái hiện tại (C) vs mong muốn (D) theo 5 bậc (Unaware, Resistant, Neutral, Supportive, Leading) để thu hẹp khoảng cách.',
    compareWith: ['Power / Interest Grid'],
  },
  {
    id: 'stk-4',
    area: 'stakeholders',
    subtopic: 'Stakeholder Analysis & Engagement',
    term: 'Salience Model',
    viTerm: 'Mô hình nổi trội',
    definition:
      'Phân loại stakeholder theo 3 trục: Power (Quyền lực), Urgency (Mức khẩn cấp) và Legitimacy (Tính chính danh).',
    compareWith: ['Power / Interest Grid'],
  },

  // 11. RISK (8 cards · 2 groups)
  {
    id: 'rsk-1',
    area: 'risk',
    subtopic: 'Risk vs Issue & Analysis',
    term: 'Risk vs Issue',
    viTerm: 'Rủi ro vs Vấn đề đã xảy ra',
    definition:
      'Risk là sự kiện bất định trong tương lai (có thể xảy ra); Issue là việc ĐÃ xảy ra ngay hiện tại và cần xử lý trực diện qua Issue Log.',
    compareWith: ['Risk Register', 'Workaround'],
  },
  {
    id: 'rsk-2',
    area: 'risk',
    subtopic: 'Risk vs Issue & Analysis',
    term: 'Qualitative Risk Analysis',
    viTerm: 'Phân tích rủi ro định tính',
    definition:
      'Xếp hạng ưu tiên rủi ro dựa trên Xác suất × Tác động (Probability & Impact Matrix) và độ khẩn cấp; làm nhanh cho mọi rủi ro.',
    compareWith: ['Quantitative Risk Analysis'],
  },
  {
    id: 'rsk-3',
    area: 'risk',
    subtopic: 'Risk vs Issue & Analysis',
    term: 'Quantitative Risk Analysis',
    viTerm: 'Phân tích rủi ro định lượng',
    definition:
      'Dùng mô hình toán (Monte Carlo, Expected Monetary Value — EMV, Cây quyết định) tính xác suất trễ/vượt chi phí bằng con số cụ thể.',
    compareWith: ['Qualitative Risk Analysis'],
  },
  {
    id: 'rsk-4',
    area: 'risk',
    subtopic: 'Risk vs Issue & Analysis',
    term: 'Secondary vs Residual Risk',
    viTerm: 'Rủi ro thứ phát vs Rủi ro còn lại',
    definition:
      'Residual Risk là rủi ro còn sót lại sau khi đã ứng phó; Secondary Risk là rủi ro MỚI phát sinh do chính giải pháp ứng phó tạo ra.',
    compareWith: ['Fallback Plan', 'Trigger Condition'],
  },
  {
    id: 'rsk-5',
    area: 'risk',
    subtopic: 'Negative Risk (Threat) Responses',
    term: 'Avoid (Risk Avoidance)',
    viTerm: 'Né tránh rủi ro',
    definition:
      'Thay đổi kế hoạch, kiến trúc hoặc phạm vi để loại bỏ hoàn toàn nguyên nhân gây mối đe dọa (đưa xác suất về 0%).',
    compareWith: ['Mitigate', 'Transfer', 'Accept'],
  },
  {
    id: 'rsk-6',
    area: 'risk',
    subtopic: 'Negative Risk (Threat) Responses',
    term: 'Mitigate (Risk Mitigation)',
    viTerm: 'Giảm thiểu rủi ro',
    definition:
      'Thực hiện hành động chủ động sớm (như kiểm thử tải, sao lưu) để giảm xác suất xảy ra hoặc giảm mức độ thiệt hại.',
    compareWith: ['Avoid', 'Transfer'],
  },
  {
    id: 'rsk-7',
    area: 'risk',
    subtopic: 'Negative Risk (Threat) Responses',
    term: 'Transfer (Risk Transference)',
    viTerm: 'Chuyển giao rủi ro',
    definition:
      'Chuyển gánh nặng tài chính/trách nhiệm cho bên thứ ba (mua bảo hiểm, ký hợp đồng giá cố định FFP); rủi ro không biến mất.',
    compareWith: ['Avoid', 'Fixed Price Contract (FFP)'],
  },
  {
    id: 'rsk-8',
    area: 'risk',
    subtopic: 'Negative Risk (Threat) Responses',
    term: 'Accept (Active vs Passive)',
    viTerm: 'Chấp nhận rủi ro',
    definition:
      'Không sửa kế hoạch gốc: Active Accept lập sẵn quỹ dự phòng / kế hoạch B (Contingency Plan); Passive Accept ghi nhận và chờ nếu xảy ra mới xử.',
    compareWith: ['Contingency Reserve', 'Workaround'],
  },

  // 12. PROCUREMENT (4 cards · 1 group)
  {
    id: 'prc-1',
    area: 'procurement',
    subtopic: 'Contract Types & Risk Sharing',
    term: 'Firm Fixed Price (FFP)',
    viTerm: 'Hợp đồng giá cố định',
    definition:
      'Tổng giá chốt cứng ngay từ đầu; RỦI RO chi phí dồn về phía Nhà cung cấp (Seller) nếu phạm vi rõ ràng.',
    compareWith: ['Time & Materials (T&M)', 'Cost Reimbursable'],
  },
  {
    id: 'prc-2',
    area: 'procurement',
    subtopic: 'Contract Types & Risk Sharing',
    term: 'Cost Reimbursable (CR / CPFF)',
    viTerm: 'Hợp đồng hoàn trả chi phí',
    definition:
      'Bên mua thanh toán chi phí thực tế hợp lệ cộng thêm phí/thưởng; RỦI RO vượt chi phí thuộc về Bên mua (Buyer), hợp việc R&D.',
    compareWith: ['Firm Fixed Price (FFP)', 'Time & Materials (T&M)'],
  },
  {
    id: 'prc-3',
    area: 'procurement',
    subtopic: 'Contract Types & Risk Sharing',
    term: 'Time & Materials (T&M)',
    viTerm: 'Hợp đồng theo công & vật tư',
    definition:
      'Tính tiền theo đơn giá giờ công (rate) và vật liệu thực dùng; phù hợp tăng cường nhân sự nhanh hoặc Agile khi chưa chốt được phạm vi.',
    compareWith: ['FFP', 'Procurement SOW'],
  },
  {
    id: 'prc-4',
    area: 'procurement',
    subtopic: 'Contract Types & Risk Sharing',
    term: 'Point of Total Assumption (PTA)',
    viTerm: 'Điểm chịu hoàn toàn chi phí',
    definition:
      'Trong hợp đồng FPIF, ngưỡng chi phí mà vượt qua đó Nhà cung cấp phải tự chịu 100% mọi chi phí phát sinh thêm.',
    compareWith: ['FPIF', 'Ceiling Price'],
  },

  // 13. AGILE & HYBRID (8 cards · 2 groups)
  {
    id: 'agl-1',
    area: 'agile',
    subtopic: 'Scrum Roles & Artifacts',
    term: 'Product Owner (PO)',
    viTerm: 'Chủ sở hữu sản phẩm',
    definition:
      'Chịu trách nhiệm tối đa hóa giá trị sản phẩm và quản lý thứ tự ưu tiên Product Backlog; không chỉ đạo cách code kỹ thuật.',
    compareWith: ['Scrum Master', 'Developers'],
  },
  {
    id: 'agl-2',
    area: 'agile',
    subtopic: 'Scrum Roles & Artifacts',
    term: 'Scrum Master',
    viTerm: 'Người điều phối Scrum',
    definition:
      'Servant Leader hướng dẫn đội nhóm thực hành Agile, bảo vệ Sprint và tháo gỡ các rào cản tổ chức (impediments).',
    compareWith: ['Product Owner', 'Servant Leadership'],
  },
  {
    id: 'agl-3',
    area: 'agile',
    subtopic: 'Scrum Roles & Artifacts',
    term: 'Definition of Done (DoD)',
    viTerm: 'Định nghĩa hoàn thành',
    definition:
      'Danh sách tiêu chuẩn chất lượng chung áp dụng cho mọi Increment (code review, test tự động, tài liệu) để đủ điều kiện phát hành.',
    compareWith: ['Definition of Ready (DoR)', 'Acceptance Criteria'],
  },
  {
    id: 'agl-4',
    area: 'agile',
    subtopic: 'Scrum Roles & Artifacts',
    term: 'Product Backlog Refinement',
    viTerm: 'Làm mịn Backlog',
    definition:
      'Hoạt động liên tục chia nhỏ, làm rõ và ước lượng lại các hạng mục đầu bảng trong Product Backlog để sẵn sàng cho Sprint Planning kế tiếp.',
    compareWith: ['Sprint Planning', 'Definition of Ready'],
  },
  {
    id: 'agl-5',
    area: 'agile',
    subtopic: 'Agile Flow, Metrics & Ceremonies',
    term: 'Sprint Review vs Retrospective',
    viTerm: 'Nghiệm thu sản phẩm vs Nhìn lại quy trình',
    definition:
      'Sprint Review trình diễn sản phẩm thực với Stakeholder để nhận phản hồi; Retrospective là họp nội bộ cải tiến quy trình làm việc.',
    compareWith: ['Sprint Planning', 'Daily Scrum'],
  },
  {
    id: 'agl-6',
    area: 'agile',
    subtopic: 'Agile Flow, Metrics & Ceremonies',
    term: 'WIP Limit (Work in Progress)',
    viTerm: 'Giới hạn việc đang làm',
    definition:
      'Giới hạn số lượng thẻ tối đa tại một cột Kanban để phát hiện điểm nghẽn sớm, giảm đa nhiệm và tăng tốc độ hoàn thành (Stop starting, start finishing).',
    compareWith: ['Lead Time vs Cycle Time', 'Throughput'],
  },
  {
    id: 'agl-7',
    area: 'agile',
    subtopic: 'Agile Flow, Metrics & Ceremonies',
    term: 'Spike (Technical / Functional)',
    viTerm: 'Nhiệm vụ thăm dò ngắn hạn',
    definition:
      'Khoảng thời gian ngắn (timebox) dành cho nghiên cứu kỹ thuật hoặc kiểm chứng rủi ro khi nhóm chưa đủ thông tin để ước lượng Story.',
    compareWith: ['Timebox', 'MVP'],
  },
  {
    id: 'agl-8',
    area: 'agile',
    subtopic: 'Agile Flow, Metrics & Ceremonies',
    term: 'Velocity vs Burndown Chart',
    viTerm: 'Vận tốc nhóm vs Biểu đồ cháy công việc',
    definition:
      'Velocity đo số Story Point hoàn thành mỗi Sprint (chỉ dùng dự báo nội bộ, không so sánh giữa các team); Burndown theo dõi công việc còn lại theo ngày.',
    compareWith: ['Burnup Chart', 'Cumulative Flow Diagram'],
  },
];
