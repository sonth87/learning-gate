import { RealWorldProject } from '@/types/realWorldProject.types';

export const REAL_WORLD_PROJECTS_PART_2A: RealWorldProject[] = [
  // ==========================================================================
  // 6. DESKTOP APP / LOCAL TOOLING
  // ==========================================================================
  {
    id: 'rw-beeware-briefcase',
    groupId: 'desktop-local',
    title: 'BeeWare Briefcase Template (Native Desktop & Mobile)',
    repoName: 'beeware/briefcase-template',
    url: 'https://github.com/beeware/briefcase-template',
    kind: 'production-template',
    complexity: 'advanced',
    scaleLabel: 'Cross-Platform Native App',
    summary:
      'Minh họa cách đóng gói ứng dụng Python chạy native trên macOS (.app), Windows (.msi), Linux, iOS và Android từ pyproject.toml.',
    purpose:
      'Giải bài toán: "Viết app bằng Python xong làm sao gửi cho người khác bấm đúp chuột mở lên như phần mềm bình thường mà không cần cài Python?"',
    howItWorks: [
      'Logic giao diện và xử lý viết bằng Python (thường dùng thư viện Toga) trong src/.',
      'File pyproject.toml chứa mục [tool.briefcase] khai báo icon, tên app, bundle ID, quyền hệ thống.',
      'Chạy lệnh `briefcase build` và `briefcase package` để đóng gói thành file cài đặt cho từng hệ điều hành.',
    ],
    directoryTree: `my_native_app/
├── src/my_app/
│   ├── __init__.py
│   ├── __main__.py      # Khởi chạy ứng dụng
│   └── app.py           # Giao diện & logic chính (tách khỏi phần đóng gói)
├── resources/           # Icon app cho macOS/Windows/iOS
└── pyproject.toml       # Khai báo [tool.briefcase] đóng gói đa nền tảng`,
    libraries: [
      {
        name: 'Briefcase',
        role: 'Công cụ đóng gói Python thành ứng dụng Native',
        whyNeeded:
          'Đóng gói kèm cả Python runtime và thư viện vào một file cài đặt duy nhất cho người dùng cuối.',
      },
      {
        name: 'Toga',
        role: 'Thư viện giao diện (GUI) native đa nền tảng',
        whyNeeded:
          'Tạo nút bấm, cửa sổ thật của hệ điều hành (Cocoa trên Mac, WinForms trên Windows) thay vì giao diện web.',
      },
    ],
    readingFocus:
      'Xem cấu hình [tool.briefcase] trong pyproject.toml và file app.py trong IDE để hiểu cách tách code giao diện khỏi cấu hình đóng gói.',
    tags: ['Desktop', 'Mobile', 'Briefcase', 'Packaging'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Viết Giao diện Native với Toga (src/my_app/app.py)',
        summaryVi:
          'Dùng `toga.App`, `toga.Box`, `toga.TextInput`, `toga.Button` để dựng cửa sổ ứng dụng gọi API gốc của hệ điều hành.',
      },
      {
        chapter: 'Bước 2',
        title: 'Cấu hình Đóng gói Đa nền tảng ([tool.briefcase.app])',
        summaryVi:
          'Khai báo `formal_name`, `bundle`, `icon` và các thư viện cần nhúng riêng cho macOS, Windows, iOS, Android trong `pyproject.toml`.',
      },
      {
        chapter: 'Bước 3',
        title: 'Build & Package (briefcase create -> build -> package)',
        summaryVi:
          'Sinh bộ cài `.dmg` trên macOS hoặc `.msi` trên Windows tự chứa sẵn Python runtime bên trong.',
      },
    ],
    ideFiles: [
      {
        path: 'pyproject.toml',
        roleDescription:
          'Khai báo cấu hình [tool.briefcase] giúp đóng gói code Python thành bộ cài đặt native cho macOS, Windows, Linux, iOS, Android.',
        keyPatterns: ['[tool.briefcase]', 'bundle', 'requires'],
        language: 'toml',
        code: `[project]
name = "my-app"
version = "0.1.0"

[tool.briefcase]
project_name = "Python Desktop Studio"
bundle = "com.learninggate.studio"
version = "0.1.0"

[tool.briefcase.app.my_app]
formal_name = "Python Desktop Studio"
description = "Ứng dụng Desktop Native viết bằng Python"
sources = ["src/my_app"]
requires = [
    "toga-core>=0.4.5",
    "httpx>=0.27.0",
]

[tool.briefcase.app.my_app.macOS]
requires = ["toga-cocoa>=0.4.5"]

[tool.briefcase.app.my_app.windows]
requires = ["toga-winforms>=0.4.5"]`,
      },
      {
        path: 'src/my_app/app.py',
        roleDescription:
          'Mã nguồn giao diện Desktop sử dụng thư viện Toga: tạo cửa sổ, ô nhập liệu và nút bấm sự kiện.',
        keyPatterns: ['toga.App', 'toga.MainWindow', 'Event Handler'],
        language: 'python',
        code: `"""Giao diện Desktop Native đa nền tảng với BeeWare Toga."""

import toga
from toga.style import Pack
from toga.style.pack import COLUMN, ROW


class DesktopStudioApp(toga.App):
    def startup(self) -> None:
        """Hàm khởi tạo cửa sổ chính ngay khi người dùng bấm đúp mở ứng dụng."""
        main_box = toga.Box(style=Pack(direction=COLUMN, padding=16))

        self.name_input = toga.TextInput(
            placeholder="Nhập tên của bạn...",
            style=Pack(flex=1, padding_right=8),
        )
        greet_button = toga.Button(
            "Chào ngay",
            on_press=self.handle_greet,
            style=Pack(padding=4),
        )

        input_row = toga.Box(
            children=[self.name_input, greet_button],
            style=Pack(direction=ROW, padding_bottom=12),
        )
        main_box.add(input_row)

        self.main_window = toga.MainWindow(title=self.formal_name)
        self.main_window.content = main_box
        self.main_window.show()

    def handle_greet(self, widget: toga.Widget) -> None:
        user_name = self.name_input.value or "Kỹ sư Python"
        self.main_window.info_dialog("Xin chào!", f"Chào mừng {user_name} đến với Native App!")`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-briefcase-pkg',
        label: 'Đóng gói Native App',
        kind: 'run',
        command: 'uv run briefcase package',
        description: 'Đóng gói ứng dụng thành bộ cài đặt hệ điều hành',
        stdout: `[my_app] Building application bundle for macOS...
[my_app] Signing application bundle...
[my_app] Packaging dist/Python Desktop Studio-0.1.0.dmg...
[OK] Packaged dist/Python Desktop Studio-0.1.0.dmg (24.8 MB)`,
      },
    ],
  },
  {
    id: 'rw-pywebview-examples',
    groupId: 'desktop-local',
    title: 'PyWebView (HTML/JS UI + Python Local Backend)',
    repoName: 'pywebview/pywebview',
    url: 'https://github.com/pywebview/pywebview/tree/master/examples',
    kind: 'production-template',
    complexity: 'basic',
    scaleLabel: 'Hybrid Desktop App',
    summary:
      'Dùng giao diện web (HTML/CSS/JS hoặc React) làm vỏ UI cho backend Python chạy local trên máy người dùng, nhẹ hơn Electron rất nhiều.',
    purpose:
      'Rất thực tế khi bạn muốn làm tool desktop có giao diện đẹp như web (dùng Tailwind/React) nhưng xử lý file, AI hoặc hệ thống bằng Python.',
    howItWorks: [
      'Python tạo một cửa sổ hệ điều hành nhúng trình duyệt sẵn có của OS (WebKit trên Mac, Edge WebView2 trên Windows).',
      'Khai báo một class `Api` trong Python và truyền vào `js_api=Api()`.',
      'Phía JavaScript có thể gọi trực tiếp hàm Python qua `window.pywebview.api.ten_ham()` và nhận kết quả về hiển thị.',
    ],
    directoryTree: `examples/
├── js_api.py            # Cách frontend JS gọi hàm Python và nhận dữ liệu trả về
├── html_load.py         # Nhúng giao diện HTML/CSS/JS nội bộ
├── file_dialog.py       # Mở hộp thoại chọn file của hệ điều hành
└── http_server.py       # Kết hợp Flask/FastAPI chạy nền bên trong app desktop`,
    libraries: [
      {
        name: 'pywebview',
        role: 'Cầu nối mở cửa sổ WebView & giao tiếp Python ↔ JS',
        whyNeeded:
          'Không phải đóng gói cả trình duyệt Chromium nặng 150MB như Electron, app tạo ra rất nhẹ.',
      },
    ],
    readingFocus:
      'Đọc file examples/js_api.py trong IDE — chỉ ~45 dòng nhưng thấy ngay cách JavaScript gọi hàm Python và nhận kết quả JSON trả về.',
    tags: ['Desktop', 'WebView', 'Python-JS Bridge', 'GUI'],
    chapters: [
      {
        chapter: 'Mẫu 1',
        title: 'Two-Way JS ↔ Python Bridge (examples/js_api.py)',
        summaryVi:
          'Truyền một đối tượng Python vào `webview.create_window(..., js_api=Api())`. Mọi method public của class `Api` đều gọi được từ JS bằng `await window.pywebview.api.method()`.',
      },
      {
        chapter: 'Mẫu 2',
        title: 'Kết hợp React/Vite hoặc Flask bên trong Desktop Window',
        summaryVi:
          'Trỏ `create_window` vào thư mục build tĩnh của React hoặc một Flask WSGI app để tận dụng toàn bộ hệ sinh thái web hiện đại.',
      },
    ],
    ideFiles: [
      {
        path: 'examples/js_api.py',
        roleDescription:
          'Ví dụ thực tế nhất của PyWebView: Giao diện HTML/JS gọi trực tiếp hàm Python trên máy local để đọc thông tin hệ thống.',
        keyPatterns: ['js_api=Api()', 'window.pywebview.api', 'Hybrid Desktop UI'],
        language: 'python',
        code: `"""Kết hợp giao diện HTML/JS với Backend Python chạy trực tiếp trên máy người dùng."""

import platform
import webview

HTML_UI = """
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>PyWebView Desktop Tool</h2>
  <button onclick="runAnalysis()">Phân tích Hệ thống bằng Python</button>
  <pre id="output" style="background:#111; color:#0f0; padding:12px;"></pre>

  <script>
    async function runAnalysis() {
      // Gọi trực tiếp hàm analyze_system() của class Api bên phía Python!
      const result = await window.pywebview.api.analyze_system("Quét nhanh");
      document.getElementById("output").textContent = JSON.stringify(result, null, 2);
    }
  </script>
</body>
</html>
"""


class LocalPythonApi:
    """Mọi phương thức của class này đều được phơi ra cho JavaScript gọi."""

    def analyze_system(self, mode: str) -> dict[str, str]:
        return {
            "status": "SUCCESS",
            "mode": mode,
            "os": platform.system(),
            "python_version": platform.python_version(),
        }


if __name__ == "__main__":
    api = LocalPythonApi()
    # Mở cửa sổ Desktop gốc của hệ điều hành và gắn cầu nối js_api
    webview.create_window("Python Local Tool", html=HTML_UI, js_api=api, width=720, height=480)
    webview.start()`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-pywebview-run',
        label: 'Chạy PyWebView Bridge',
        kind: 'run',
        command: 'uv run python examples/js_api.py',
        description: 'Mở cửa sổ Desktop và gọi hàm Python từ JavaScript',
        stdout: `[pywebview] Window initialized (Cocoa WebKit backend)
[JS -> Python Bridge] window.pywebview.api.analyze_system("Quét nhanh")
[Python -> JS Response] {
  "status": "SUCCESS",
  "mode": "Quét nhanh",
  "os": "Darwin",
  "python_version": "3.12.7"
}`,
      },
    ],
  },

  // ==========================================================================
  // 7. AI / LLM APPLICATION, RAG & AGENT WORKFLOW
  // ==========================================================================
  {
    id: 'rw-langgraph-examples',
    groupId: 'ai-llm-rag',
    title: 'LangGraph Examples (Stateful AI Agents & Workflows)',
    repoName: 'langchain-ai/langgraph',
    url: 'https://github.com/langchain-ai/langgraph/tree/main/examples',
    kind: 'production-template',
    complexity: 'master',
    scaleLabel: 'AI Agent State Machine',
    summary:
      'Minh họa cách tổ chức AI Agent phức tạp dưới dạng Đồ thị Trạng thái (State Graph): có vòng lặp suy nghĩ, gọi tool, lưu trí nhớ và duyệt bởi con người.',
    purpose:
      'Khi gọi LLM 1 lần không đủ (Agent cần tra cứu DB -> kiểm tra kết quả -> nếu sai thì sửa truy vấn rồi thử lại), LangGraph giúp kiểm soát luồng đi chặt chẽ.',
    howItWorks: [
      'Định nghĩa `State` (TypedDict/Pydantic) lưu toàn bộ lịch sử tin nhắn và dữ liệu đang xử lý.',
      'Mỗi bước xử lý là một `Node` (hàm Python nhận State và trả về State cập nhật).',
      'Các cạnh điều kiện (`Conditional Edges`) quyết định sau bước LLM: gọi Tool tiếp hay kết thúc trả lời người dùng.',
    ],
    directoryTree: `examples/
├── customer-support/    # Agent hỗ trợ khách hàng có trí nhớ & gọi nhiều tool
├── rag/                 # Agentic RAG tự đánh giá tài liệu tìm được có khớp không
├── multi_agent/         # Nhiều Agent chuyên biệt phối hợp giải quyết bài toán
└── human_in_the_loop/   # Tạm dừng chờ con người bấm "Duyệt" trước khi chạy tool quan trọng`,
    libraries: [
      {
        name: 'LangGraph',
        role: 'Điều phối luồng AI Agent theo đồ thị trạng thái',
        whyNeeded:
          'Tránh việc viết vòng lặp `while` gọi LLM lộn xộn khó debug, hỗ trợ streaming và checkpointing.',
      },
      {
        name: 'LangChain Core',
        role: 'Chuẩn hóa giao diện gọi nhiều LLM (OpenAI, Gemini, Anthropic)',
        whyNeeded:
          'Đổi nhà cung cấp model hoặc định nghĩa Tool schema dễ dàng mà không phải viết lại toàn bộ code.',
      },
    ],
    readingFocus:
      'Đọc file agent_graph.py trong IDE để nắm 3 khái niệm cốt lõi của mọi ứng dụng LangGraph: State, Node và Conditional Edge.',
    tags: ['AI Agent', 'LangGraph', 'LLM', 'Workflow'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Khai báo AgentState (Bộ nhớ dùng chung của đồ thị)',
        summaryVi:
          'Dùng `TypedDict` khai báo các trường dữ liệu được truyền qua lại giữa các bước (danh sách messages, số lần thử lại, kết quả gọi tool).',
      },
      {
        chapter: 'Bước 2',
        title: 'Định nghĩa các Nodes (agent_node, tool_node)',
        summaryVi:
          'Mỗi Node chỉ là một hàm Python thuần nhận `state: AgentState` và trả về dict chứa những trường muốn cập nhật.',
      },
      {
        chapter: 'Bước 3',
        title: 'Nối cạnh điều kiện (add_conditional_edges) & Compile',
        summaryVi:
          'Hàm router kiểm tra nếu LLM yêu cầu gọi Tool thì rẽ sang `tool_node` rồi quay lại `agent_node`; nếu đã có câu trả lời cuối thì rẽ về `END`.',
      },
    ],
    ideFiles: [
      {
        path: 'src/agent/agent_graph.py',
        roleDescription:
          'Minh họa rõ ràng cách xây dựng một đồ thị trạng thái AI Agent (StateGraph) với Node suy luận, Node gọi công cụ và Cạnh điều kiện.',
        keyPatterns: ['TypedDict State', 'StateGraph', 'Conditional Edges'],
        language: 'python',
        code: `"""Xây dựng luồng AI Agent theo mô hình Đồ thị Trạng thái (LangGraph Architecture)."""

from typing import Literal, TypedDict


# 1. STATE: Bộ nhớ dùng chung được truyền qua mọi Node trong đồ thị
class AgentState(TypedDict):
    question: str
    tool_Needed: bool
    tool_output: str
    final_answer: str


# 2. NODES: Mỗi Node là một hàm nhận State hiện tại và trả về phần dữ liệu cập nhật
def reasoning_node(state: AgentState) -> dict:
    """Node 1: Phân tích câu hỏi xem có cần tra cứu công cụ bên ngoài không."""
    q = state["question"].lower()
    if "giá" in q or "tồn kho" in q and not state.get("tool_output"):
        return {"tool_Needed": True}
    return {
        "tool_Needed": False,
        "final_answer": f"Đã tổng hợp câu trả lời dựa trên dữ liệu: {state.get('tool_output', 'kiến thức sẵn có')}",
    }


def execute_tool_node(state: AgentState) -> dict:
    """Node 2: Gọi Tool tra cứu Database / API rồi lưu kết quả vào State."""
    return {
        "tool_Needed": False,
        "tool_output": "Sản phẩm MacBook Pro M4: Tồn kho 12 máy, giá 49.900.000đ",
    }


# 3. CONDITIONAL EDGE ROUTER: Quyết định bước tiếp theo đi đâu
def route_after_reasoning(state: AgentState) -> Literal["call_tool", "finish"]:
    if state["tool_Needed"]:
        return "call_tool"
    return "finish"`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-langgraph-run',
        label: 'Chạy luồng StateGraph',
        kind: 'run',
        command: 'uv run python -m src.agent.agent_graph',
        description: 'Mô phỏng đường đi của câu hỏi qua các Node trong đồ thị Agent',
        stdout: `[Step 1: reasoning_node] Phát hiện câu hỏi cần tra cứu tồn kho -> tool_Needed=True
[Edge Router] route_after_reasoning -> rẽ nhánh sang 'call_tool'
[Step 2: execute_tool_node] Đã lấy dữ liệu: Tồn kho 12 máy, giá 49.900.000đ
[Step 3: reasoning_node] Tổng hợp câu trả lời cuối cùng -> route 'finish' (END)`,
      },
    ],
  },
  {
    id: 'rw-langchain-open-canvas',
    groupId: 'ai-llm-rag',
    title: 'Open Canvas (Full-stack AI Workspace App)',
    repoName: 'langchain-ai/open-canvas',
    url: 'https://github.com/langchain-ai/open-canvas',
    kind: 'production-template',
    complexity: 'pro',
    scaleLabel: 'Interactive AI App',
    summary:
      'Ứng dụng AI thực tế cho phép người dùng và Agent cùng soạn thảo, chỉnh sửa tài liệu/code theo thời gian thực (tương tự ChatGPT Canvas).',
    purpose:
      'Cho thấy cách kết nối phần orchestration AI (streaming từng token, lưu lịch sử phiên bản) với giao diện tương tác của người dùng.',
    howItWorks: [
      'Người dùng bôi đen đoạn văn bản hoặc gõ yêu cầu chỉnh sửa.',
      'Agent đọc ngữ cảnh hiện tại của tài liệu + lịch sử chat để quyết định sửa một phần hay viết lại.',
      'Server stream từng chữ (SSE/WebSocket) về giao diện để người dùng thấy AI gõ trực tiếp.',
    ],
    directoryTree: `open-canvas/
├── apps/
│   ├── agents/          # Luồng xử lý AI Agent, định tuyến tác vụ & bộ nhớ
│   └── web/             # Giao diện soạn thảo & khung chat tương tác
└── README.md            # Sơ đồ kiến trúc & hướng dẫn chạy local`,
    libraries: [
      {
        name: 'LangGraph / LangSmith',
        role: 'Chạy Agent & Theo dõi log từng bước AI suy nghĩ',
        whyNeeded:
          'Khi AI trả lời sai, LangSmith giúp soi lại chính xác prompt nào, bước nào bị lỗi.',
      },
    ],
    readingFocus:
      'Xem file artifact_rewriter.py trong IDE để hiểu cách AI chỉ sửa đúng đoạn văn bản người dùng bôi đen (Targeted Rewrite) kèm lưu lịch sử phiên bản.',
    tags: ['AI App', 'Streaming', 'Agent', 'UX'],
    ideFiles: [
      {
        path: 'src/canvas/artifact_rewriter.py',
        roleDescription:
          'Quản lý tài liệu cộng tác (Artifact Versioning) và sửa đúng phần văn bản người dùng bôi đen.',
        keyPatterns: ['Artifact Versioning', 'Targeted Selection Rewrite'],
        language: 'python',
        code: `"""Mô hình quản lý phiên bản tài liệu (Canvas Artifact) khi cộng tác với AI."""

from dataclasses import dataclass, field


@dataclass
class ArtifactVersion:
    version: int
    content: str
    change_summary: str


@dataclass
class CanvasWorkspace:
    versions: list[ArtifactVersion] = field(default_factory=list)

    def apply_selected_rewrite(
        self, selected_span: str, replacement: str, note: str
    ) -> ArtifactVersion:
        """Chỉ thay thế đúng đoạn người dùng bôi đen và tạo phiên bản lịch sử mới."""
        current_text = self.versions[-1].content if self.versions else ""
        updated_text = current_text.replace(selected_span, replacement, 1)
        new_ver = ArtifactVersion(
            version=len(self.versions) + 1,
            content=updated_text,
            change_summary=note,
        )
        self.versions.append(new_ver)
        return new_ver`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-canvas-run',
        label: 'Chạy Artifact Rewrite',
        kind: 'run',
        command: 'uv run python -m src.canvas.artifact_rewriter',
        description: 'Cập nhật đoạn bôi đen và lưu phiên bản v2 trên Canvas',
        stdout: `[Artifact v1] "Hàm xử lý đồng bộ bằng requests.get"
[User Selection] Bôi đen "đồng bộ bằng requests.get" -> yêu cầu "Đổi sang bất đồng bộ httpx"
[Artifact v2] "Hàm xử lý bất đồng bộ bằng httpx.AsyncClient" (Đã lưu lịch sử v2)`,
      },
    ],
  },
  {
    id: 'rw-llamaindex-rag',
    groupId: 'ai-llm-rag',
    title: 'LlamaIndex RAG Pipelines & Packs',
    repoName: 'run-llama/llama_index',
    url: 'https://github.com/run-llama/llama_index/tree/main/docs/docs/examples',
    kind: 'production-template',
    complexity: 'pro',
    scaleLabel: 'Modular RAG Pipeline',
    summary:
      'Hệ thống RAG (Retrieval-Augmented Generation) tách từng công đoạn độc lập: đọc tài liệu -> cắt đoạn -> tạo vector -> truy xuất -> tổng hợp.',
    purpose:
      'Giúp AI trả lời chính xác dựa trên tài liệu PDF, Word, Notion nội bộ của riêng bạn mà không bị "bịa" thông tin.',
    howItWorks: [
      'Ingestion: Load file PDF/Markdown và cắt nhỏ thành các đoạn văn (Chunks).',
      'Indexing: Chuyển mỗi đoạn văn thành vector số (Embedding) và lưu vào Vector Database.',
      'Retrieval: Khi user hỏi, tìm Top-K đoạn văn có nghĩa gần nhất với câu hỏi.',
      'Synthesis: Ghép Top-K đoạn văn đó vào prompt gửi cho LLM viết câu trả lời chuẩn xác.',
    ],
    directoryTree: `llama-index-packs/
├── loaders/             # Đọc dữ liệu từ PDF, Notion, Slack, SQL...
├── node_parsers/        # Chia nhỏ tài liệu thông minh (Chunking)
├── embeddings/          # Chuyển văn bản thành Vector
└── query_engines/       # Kết hợp tìm kiếm Vector + LLM trả lời`,
    libraries: [
      {
        name: 'LlamaIndex',
        role: 'Framework chuyên sâu về dữ liệu & RAG cho LLM',
        whyNeeded:
          'Cung cấp sẵn hàng trăm bộ đọc dữ liệu (PDF, CSV, Web) và kỹ thuật tìm kiếm nâng cao (Hybrid Search, Rerank).',
      },
      {
        name: 'Vector DB (Chroma / Qdrant)',
        role: 'Lưu trữ & tìm kiếm tương đồng ngữ nghĩa',
        whyNeeded:
          'Database SQL thông thường chỉ tìm khớp từ khóa; Vector DB tìm được theo ý nghĩa câu.',
      },
    ],
    readingFocus:
      'Đọc file rag_pipeline.py trong IDE để thấy rõ 4 công đoạn của một hệ thống RAG: Chunking -> Embedding -> Retrieval -> Prompt Synthesis.',
    tags: ['RAG', 'LlamaIndex', 'Vector DB', 'LLM'],
    chapters: [
      {
        chapter: 'Công đoạn 1 & 2',
        title: 'Document Loading & Node Chunking (Cắt nhỏ tài liệu có gối đầu)',
        summaryVi:
          'Một file PDF 100 trang không thể nhồi hết vào 1 prompt. Ta cắt thành các đoạn ~512 tokens có phần gối đầu (overlap) để không bị đứt câu.',
      },
      {
        chapter: 'Công đoạn 3 & 4',
        title: 'Vector Indexing, Top-K Retrieval & Grounded Answer Synthesis',
        summaryVi:
          'Tìm 3 đoạn văn có điểm tương đồng (Cosine Similarity) cao nhất với câu hỏi rồi ép LLM chỉ được trả lời dựa trên 3 đoạn trích dẫn đó.',
      },
    ],
    ideFiles: [
      {
        path: 'src/rag/rag_pipeline.py',
        roleDescription:
          'Mô phỏng trọn vẹn 4 bước của một Pipeline RAG: Cắt nhỏ tài liệu (Chunking), Tìm kiếm đoạn liên quan (Retrieval) và Ghép ngữ cảnh tạo Prompt.',
        keyPatterns: ['Chunking', 'Top-K Retrieval', 'Grounded Prompting'],
        language: 'python',
        code: `"""Pipeline RAG (Retrieval-Augmented Generation) giải thích từng bước cho người mới."""


def split_into_chunks(document: str, chunk_size: int = 120) -> list[str]:
    """[Bước 1 - Chunking] Cắt tài liệu dài thành các đoạn nhỏ dễ tìm kiếm."""
    paragraphs = [p.strip() for p in document.split("\n\n") if p.strip()]
    return [p[:chunk_size] for p in paragraphs]


def retrieve_top_k(chunks: list[str], query: str, k: int = 2) -> list[str]:
    """[Bước 2 - Retrieval] Tìm k đoạn văn khớp nhất với câu hỏi của người dùng."""
    query_words = set(query.lower().split())
    scored = sorted(
        chunks,
        key=lambda c: len(query_words.intersection(c.lower().split())),
        reverse=True,
    )
    return scored[:k]


def build_grounded_prompt(query: str, retrieved_chunks: list[str]) -> str:
    """[Bước 3 - Synthesis] Ghép các đoạn trích dẫn tìm được vào Prompt gửi cho LLM."""
    context_block = "\n---\n".join(retrieved_chunks)
    return (
        "Hãy trả lời câu hỏi CHỈ dựa trên ngữ cảnh trích dẫn dưới đây:\n"
        f"NGỮ CẢNH:\n{context_block}\n\n"
        f"CÂU HỎI: {query}"
    )`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-rag-query',
        label: 'Chạy Truy vấn RAG',
        kind: 'run',
        command: 'uv run python -m src.rag.rag_pipeline',
        description: 'Cắt tài liệu, tìm Top-2 đoạn khớp câu hỏi và sinh Prompt có trích dẫn',
        stdout: `[Step 1: Chunking] Đã cắt sổ tay kỹ thuật thành 14 chunks.
[Step 2: Retrieval] Top-2 chunks khớp với "chính sách hoàn tiền":
  1. "Khách hàng được hoàn tiền 100% trong vòng 14 ngày nếu chưa kích hoạt license."
  2. "Yêu cầu hoàn tiền được xử lý tự động qua cổng Stripe trong 3-5 ngày làm việc."
[Step 3: Synthesis] Đã tạo Grounded Prompt gửi tới LLM.`,
      },
    ],
  },
];
