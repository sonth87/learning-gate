import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_6_LESSONS: LessonTopic[] = [
  {
    id: 's6-ai-data-automation',
    stageId: 'stage-6',
    level: 'pro',
    order: 11,
    title: '6.1. Các Nhánh Chuyên sâu: AI/LLM & RAG, Data Engineering (Polars) & Automation',
    shortDescription:
      'Khám phá các lĩnh vực Python độc chiếm vị thế số 1 thế giới: Vector hóa với NumPy, xử lý dữ liệu tốc độ Rust với Polars, kiến trúc RAG cho LLM và Playwright.',
    estimatedMinutes: 40,
    theoryParagraphs: [
      'Sau khi làm chủ Python Core và Backend/Concurrency, bạn có thể mở rộng sang 4 lĩnh vực chuyên sâu mà Python thống trị tuyệt đối: (A) **AI / Machine Learning & LLM Engineering** (`NumPy`, `PyTorch`, `Transformers`, Vector Database & kiến trúc **RAG - Retrieval-Augmented Generation**); (B) **Data Engineering** (`Polars` viết bằng Rust nhanh gấp 10–30 lần Pandas, điều phối pipeline với `Apache Airflow`); (C) **Automation & Testing** (`Playwright` tự động hóa trình duyệt sync/async, `Selectolax`/`BeautifulSoup4`); và (D) **Computer Vision** (`OpenCV`, `YOLO`).',
      'Bí quyết hiệu năng cốt lõi khi làm việc với dữ liệu và AI trong Python là **Vectorization (Tính toán Vector hóa)**: Thay vì viết vòng lặp `for` bằng Python thuần để cộng từng phần tử mảng (chậm do overhead kiểm tra kiểu ở từng bước của CPython), chúng ta đẩy toàn bộ mảng xuống tầng C/Rust của `NumPy` hoặc `Polars` để tính toán song song bằng tập lệnh SIMD của CPU.',
      'Đối với lập trình viên Web/Backend hiện đại, nhánh **LLM Engineering & RAG** cho phép kết hợp trực tiếp `FastAPI` + `Pydantic` (Structured Outputs cho AI) + Vector Embeddings để xây dựng các trợ lý AI hỏi đáp trên dữ liệu nội bộ doanh nghiệp.',
    ],
    analogy: {
      title: 'Vectorization là "Dập khuôn Công nghiệp 1000 Sản phẩm 1 Nhịp" vs. "Làm Thủ công Từng Cái"',
      realWorldScenario:
        'Tại sao Python thuần bị coi là chậm khi lặp 10 triệu vòng, nhưng lại là ngôn ngữ số 1 thế giới về AI và Khoa học dữ liệu?',
      mappingPoints: [
        {
          realWorld: 'Người thợ thủ công kiểm tra và đóng dấu từng phong bì một (`for x in py_list`)',
          pythonEquivalent: 'Vòng lặp `for` trên `list` thuần của Python',
          explanation: 'Mỗi vòng lặp, CPython phải mở hộp `PyObject`, kiểm tra kiểu dữ liệu, tìm hàm `__add__`, cấp phát đối tượng mới — lặp lại 10 triệu lần sẽ rất tốn thời gian.',
        },
        {
          realWorld: 'Máy dập thủy lực bằng thép đúc (C/Rust) dập 10.000 phong bì trong 1 cú nhấn (`NumPy` / `Polars`)',
          pythonEquivalent: '`arr * 1.15` trong NumPy hoặc biểu thức `pl.col("price") * 1.15` trong Polars',
          explanation: 'Python chỉ đóng vai trò "nhạc trưởng" ra lệnh 1 dòng, còn toàn bộ việc tính toán nặng được thực thi bằng mã máy C/Rust trên mảng bộ nhớ liên tục không có GIL cản trở!',
        },
        {
          realWorld: 'Thư viện tài liệu mở cho chuyên gia tra cứu trước khi trả lời (`Kiến trúc RAG`)',
          pythonEquivalent: 'Vector Search (Embeddings) + Prompt Context + LLM API',
          explanation: 'Thay vì bắt mô hình AI học thuộc lòng tài liệu mật của công ty, hệ thống tìm đúng 5 đoạn văn bản liên quan nhất trong Vector DB rồi đính kèm vào câu hỏi để AI trả lời chính xác mà không bịa đặt (Hallucination).',
        },
      ],
      mentalModelTip:
        'Khi làm việc với `NumPy`, `Pandas` hoặc `Polars`: Nếu bạn thấy mình đang viết vòng lặp `for row in df:` để tính toán trên từng dòng, hãy dừng lại ngay và thay bằng phép toán cột (Vectorized Expression)!',
    },
    codeExamples: [
      {
        id: 'ex-s6-1-rag',
        title: 'Structured Output cho AI Agent với Pydantic & Pipeline RAG thu gọn',
        description: 'Sử dụng Pydantic để ép LLM trả về đúng cấu trúc JSON chuẩn và tính độ tương đồng Cosine.',
        code: `import math
from pydantic import BaseModel, Field

# 1. Định nghĩa Schema ép kiểu kết quả trả về từ AI (Structured LLM Output)
class DocumentAnalysis(BaseModel):
    summary: str = Field(description="Tóm tắt nội dung trong 2 câu")
    sentiment_score: float = Field(ge=-1.0, le=1.0)
    action_items: list[str]

# 2. Hàm tính Cosine Similarity giữa 2 Vector Embedding trong kiến trúc RAG
def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b, strict=True))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return round(dot_product / (norm_a * norm_b), 4)

query_vec = [0.8, 0.6, 0.0]
doc_vec = [0.8, 0.6, 0.0]
print("Độ tương đồng ngữ nghĩa:", cosine_similarity(query_vec, doc_vec))`,
        output: `Độ tương đồng ngữ nghĩa: 1.0`,
        annotations: [
          { line: 5, explanation: 'Hầu hết các SDK LLM hiện đại (OpenAI, Gemini, Anthropic, LangChain/Instructor) đều nhận trực tiếp class `Pydantic BaseModel` để đảm bảo AI trả về JSON chuẩn 100%.' },
          { line: 12, explanation: 'Kết hợp `sum()` + Generator Expression + `zip(..., strict=True)` để tính tích vô hướng (Dot Product) ngắn gọn.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Xây dựng hệ thống AI Document Assistant (Project 7 trong PDF)',
        scenario: 'Cho phép nhân viên tải lên hàng trăm file PDF quy trình nội bộ và đặt câu hỏi bằng ngôn ngữ tự nhiên.',
        whyPythonFits: 'Cắt nhỏ văn bản (Chunking), chuyển thành Vector Embeddings, lưu vào Vector DB (Qdrant/pgvector) và phục vụ qua FastAPI Streaming.',
      },
      {
        title: 'Pipeline ETL xử lý file CSV/Parquet hàng chục triệu dòng với Polars',
        scenario: 'Tổng hợp doanh thu theo thời gian thực từ các file log lớn mà không cần cụm máy chủ Spark đắt đỏ.',
        whyPythonFits: '`Polars` sử dụng Lazy Execution (`pl.scan_parquet()`) tự động tối ưu hóa cây truy vấn và chạy đa luồng bằng Rust.',
      },
    ],
    tipsAndBestPractices: [
      'Với các dự án xử lý bảng dữ liệu mới, hãy ưu tiên tìm hiểu `Polars` bên cạnh `Pandas` vì Polars có cú pháp nhất quán, kiểm tra kiểu chặt chẽ và tốc độ vượt trội.',
      'Khi cào dữ liệu hoặc tự động hóa trình duyệt với `Playwright`, hãy dùng bản `playwright.async_api` để chạy đồng thời nhiều tab trình duyệt trên cùng 1 tiến trình.',
    ],
    commonIssues: [
      {
        id: 'issue-s6-loop-dataframe',
        title: 'Anti-pattern: Dùng vòng lặp for duyệt từng dòng trên mảng dữ liệu lớn',
        severity: 'warning',
        symptom: 'Script xử lý 1 triệu dòng dữ liệu chạy mất 45 giây thay vì 0.05 giây.',
        whyItHappens:
          'Lặp từng dòng bằng Python thuần (`iterrows()`) phá vỡ hoàn toàn cơ chế tính toán vector hóa ở tầng C/Rust.',
        wrongCode: `# CHẬM GẤP 500 LẦN: Lặp thủ công từng phần tử trong Python\nresult = []\nfor x in large_array:\n    result.append(x * 2 + 5)`,
        rightCode: `# VECTORIZED (Trong NumPy / Polars): Chạy ở tầng C/Rust siêu tốc\n# result = np_array * 2 + 5`,
        fixExplanation: 'Luôn biểu diễn phép toán dưới dạng thao tác trên toàn bộ mảng/cột (Vectorized operations) khi dùng NumPy, Pandas, Polars.',
      },
    ],
    jsComparison: [
      {
        concept: 'Tự động hóa trình duyệt (E2E & Scraping)',
        jsTsWay: 'Playwright for Node.js: await page.goto(url); await page.locator(...).click();',
        pythonWay: 'Playwright for Python: await page.goto(url); await page.locator(...).click()',
        jsCode: `await page.goto('https://example.com');\nconst title = await page.title();`,
        pythonCode: `await page.goto("https://example.com")\ntitle = await page.title()`,
        keyDifference: 'API của Playwright bên Python giống tới 99% bên TypeScript, nhưng bên Python bạn có thể kết hợp trực tiếp kết quả thu thập được với Polars/Pandas/PyTorch trong cùng một codebase!',
      },
    ],
    relatedTermIds: ['eco-pydantic', 'eco-fastapi', 'fn-zip', 'concept-generator'],
    relatedLessonIds: ['s5-asyncio-gil-concurrency', 's7-production-architecture'],
    relatedExerciseIds: ['ex-s5-async-semaphore'],
  },
];
