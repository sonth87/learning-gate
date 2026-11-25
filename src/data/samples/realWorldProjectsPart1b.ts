import { RealWorldProject } from '@/types/realWorldProject.types';

export const REAL_WORLD_PROJECTS_PART_1B: RealWorldProject[] = [
  // ==========================================================================
  // 3. DATA SCIENCE & MACHINE LEARNING PIPELINE
  // ==========================================================================
  {
    id: 'rw-cookiecutter-ds',
    groupId: 'data-ml',
    title: 'Cookiecutter Data Science (Chuẩn Tổ chức Dự án ML)',
    repoName: 'drivendataorg/cookiecutter-data-science',
    url: 'https://github.com/drivendataorg/cookiecutter-data-science',
    kind: 'production-template',
    complexity: 'pro',
    scaleLabel: 'Data / ML Pipeline',
    summary:
      'Bộ khung chuẩn cho dự án Data Science & Machine Learning: tách biệt dữ liệu thô, notebook thử nghiệm và code Python tái sử dụng.',
    purpose:
      'Giải quyết vấn đề kinh điển của người làm dữ liệu: code nằm lộn xộn trong hàng chục file Jupyter Notebook, chạy lại không ra kết quả cũ.',
    howItWorks: [
      'Dữ liệu gốc tải về đặt bất biến trong data/raw/ (tuyệt đối không sửa tay).',
      'Thử nghiệm biểu đồ và ý tưởng nhanh trong thư mục notebooks/.',
      'Code xử lý dữ liệu và huấn luyện ổn định được đóng gói thành module trong package (dataset.py, features.py, modeling/train.py).',
      'Mô hình sau khi train lưu vào models/ để predict.py tái sử dụng.',
    ],
    directoryTree: `project_name/
├── data/
│   ├── raw/             # Dữ liệu gốc ban đầu (chỉ đọc, không sửa)
│   ├── interim/         # Dữ liệu trung gian đang làm sạch
│   └── processed/       # Dữ liệu sạch sẵn sàng đưa vào model
├── notebooks/           # Jupyter notebooks để khám phá (EDA)
├── models/              # File model đã huấn luyện (.pkl, .pt)
├── pyproject.toml       # Biến thư mục code thành package cài đặt được
└── my_ml_pkg/
    ├── dataset.py       # Tải & tiền xử lý dữ liệu từ raw -> interim
    ├── features.py      # Tạo đặc trưng (Feature Engineering) -> processed
    └── modeling/
        ├── train.py     # Huấn luyện mô hình & lưu vào models/
        └── predict.py   # Nạp model từ models/ để dự đoán dữ liệu mới`,
    libraries: [
      {
        name: 'Pandas / Polars',
        role: 'Xử lý dữ liệu dạng bảng (CSV, Parquet)',
        whyNeeded:
          'Lọc, gom nhóm, làm sạch hàng triệu dòng dữ liệu nhanh gọn hơn nhiều so với vòng lặp Python thuần.',
      },
      {
        name: 'Scikit-learn',
        role: 'Thuật toán Machine Learning & Pipeline',
        whyNeeded:
          'Cung cấp sẵn hồi quy, phân loại, chia tập train/test và các thước đo độ chính xác.',
      },
      {
        name: 'Typer / Loguru',
        role: 'Chạy từng bước pipeline từ dòng lệnh & Ghi log',
        whyNeeded:
          'Giúp tự động hóa toàn bộ quy trình `python -m my_ml_pkg.modeling.train` trên server.',
      },
    ],
    readingFocus:
      'Đọc 2 file dataset.py và modeling/train.py trong IDE để thấy cách tách bước làm sạch dữ liệu khỏi bước huấn luyện mô hình.',
    tags: ['Data Science', 'ML', 'Pipeline', 'Notebooks'],
    chapters: [
      {
        chapter: 'Nguyên tắc 1',
        title: 'Data is Immutable (Dữ liệu gốc trong data/raw/ là bất biến)',
        summaryVi:
          'Không bao giờ mở Excel sửa trực tiếp file trong data/raw/. Mọi bước xóa dòng lỗi, đổi tên cột phải viết bằng code trong dataset.py rồi xuất ra data/processed/.',
      },
      {
        chapter: 'Nguyên tắc 2',
        title: 'Notebooks are for Exploration, Source Files are for Repetition',
        summaryVi:
          'Notebook chỉ dùng để vẽ đồ thị khám phá. Khi một hàm làm sạch dữ liệu được dùng ở 2 notebook trở lên, hãy rút nó vào my_ml_pkg/features.py và import vào.',
      },
    ],
    ideFiles: [
      {
        path: 'my_ml_pkg/dataset.py',
        roleDescription:
          'Đọc dữ liệu gốc từ data/raw/, loại bỏ bản ghi lỗi và xuất bảng sạch ra data/processed/ mà không bao giờ ghi đè file gốc.',
        keyPatterns: ['pathlib.Path', 'Immutable Raw Data', 'Reproducible ETL'],
        language: 'python',
        code: `"""Bước 1 của ML Pipeline: Đọc dữ liệu thô (raw) và làm sạch sang (processed)."""

import csv
from pathlib import Path


def clean_customer_records(raw_rows: list[dict[str, str]]) -> list[dict[str, float | int]]:
    """Làm sạch dữ liệu: bỏ các dòng thiếu thông tin và chuyển kiểu số chuẩn xác."""
    cleaned: list[dict[str, float | int]] = []
    for row in raw_rows:
        if not row.get("monthly_spend") or not row.get("tenure_months"):
            continue
        spend = float(row["monthly_spend"])
        tenure = int(row["tenure_months"])
        if spend >= 0 and tenure > 0:
            cleaned.append(
                {
                    "tenure_months": tenure,
                    "monthly_spend": spend,
                    "annual_value": round(spend * 12, 2),
                }
            )
    return cleaned


if __name__ == "__main__":
    sample_raw = [
        {"tenure_months": "12", "monthly_spend": "49.5"},
        {"tenure_months": "", "monthly_spend": "100.0"},  # Dòng lỗi thiếu dữ liệu -> sẽ bị lọc bỏ
        {"tenure_months": "24", "monthly_spend": "85.0"},
    ]
    result = clean_customer_records(sample_raw)
    print(f"Đã làm sạch: giữ lại {len(result)}/{len(sample_raw)} bản ghi hợp lệ:", result)`,
      },
      {
        path: 'my_ml_pkg/modeling/train.py',
        roleDescription:
          'Bước huấn luyện mô hình: đọc dữ liệu từ data/processed/, khớp tham số mô hình và đánh giá sai số.',
        keyPatterns: ['Model Training', 'Metrics Evaluation'],
        language: 'python',
        code: `"""Bước 2 của ML Pipeline: Huấn luyện mô hình dự báo và chấm điểm độ chính xác."""


def fit_simple_linear_model(xs: list[float], ys: list[float]) -> tuple[float, float]:
    """Tính hệ số góc (slope w) và hệ số chặn (intercept b) cho y = w*x + b."""
    n = len(xs)
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den = sum((x - mean_x) ** 2 for x in xs)
    w = num / den if den != 0 else 0.0
    b = mean_y - w * mean_x
    return round(w, 4), round(b, 4)


if __name__ == "__main__":
    # Số tháng gắn bó (xs) -> Tổng chi tiêu (ys)
    tenure = [6.0, 12.0, 18.0, 24.0, 36.0]
    ltv = [310.0, 600.0, 910.0, 1205.0, 1800.0]
    weight, bias = fit_simple_linear_model(tenure, ltv)
    print(f"Mô hình đã huấn luyện: LTV = {weight} * tenure + {bias}")`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-ds-pipeline',
        label: 'Chạy Pipeline Làm sạch & Train',
        kind: 'run',
        command: 'uv run python -m my_ml_pkg.modeling.train',
        description: 'Thực thi bước làm sạch dữ liệu và huấn luyện mô hình hồi quy',
        stdout: `Đã làm sạch: giữ lại 2/3 bản ghi hợp lệ: [{'tenure_months': 12, 'monthly_spend': 49.5, 'annual_value': 594.0}, {'tenure_months': 24, 'monthly_spend': 85.0, 'annual_value': 1020.0}]
Mô hình đã huấn luyện: LTV = 49.7087 * tenure + 9.2233`,
      },
    ],
  },
  {
    id: 'rw-pbl-streamlit-app',
    groupId: 'data-ml',
    title: 'Build Your First Streamlit Data App (PBL)',
    repoName: 'streamlit/streamlit',
    url: 'https://docs.streamlit.io/get-started/tutorials/create-an-app',
    kind: 'pbl-tutorial',
    complexity: 'basic',
    scaleLabel: 'Interactive Data Dashboard',
    summary:
      'Biến các đoạn script phân tích dữ liệu Python thành một trang web Dashboard tương tác đẹp mắt chỉ bằng Python thuần (không cần HTML/CSS).',
    purpose:
      'Giúp bạn nhanh chóng tạo giao diện biểu đồ, bộ lọc để đồng nghiệp hoặc khách hàng bấm xem trực tiếp dữ liệu hoặc thử nghiệm mô hình AI.',
    howItWorks: [
      'Viết script Python đọc file CSV hoặc gọi API dữ liệu (dùng @st.cache_data để không phải tải lại mỗi lần bấm nút).',
      'Dùng các hàm st.slider(), st.selectbox() để tạo thanh lọc trên web.',
      'Mỗi khi người dùng đổi bộ lọc, Streamlit chạy lại script từ trên xuống và cập nhật biểu đồ tức thì.',
    ],
    directoryTree: `streamlit_app/
├── app.py               # File Python duy nhất vừa xử lý dữ liệu vừa dựng giao diện web
├── data/                # File CSV dữ liệu mẫu
└── requirements.txt     # streamlit, pandas, numpy`,
    libraries: [
      {
        name: 'Streamlit',
        role: 'Tạo Web UI cho Data/AI chỉ bằng Python',
        whyNeeded:
          'Không cần học React/HTML/CSS vẫn làm được dashboard tương tác trong vài chục dòng code.',
      },
      {
        name: 'Pandas',
        role: 'Đọc bảng CSV và lọc dữ liệu theo điều kiện',
        whyNeeded:
          'Streamlit tích hợp trực tiếp với Pandas DataFrame để vẽ bảng và đồ thị chỉ bằng 1 dòng `st.bar_chart(df)`.',
      },
    ],
    readingFocus:
      'Xem file app.py trong IDE để hiểu cơ chế `@st.cache_data` và cách `st.slider()` trả trực tiếp giá trị người dùng kéo vào biến Python.',
    tags: ['PBL', 'Streamlit', 'Dashboard', 'Data'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Tải dữ liệu & Caching với @st.cache_data',
        summaryVi:
          'Vì Streamlit chạy lại toàn bộ file Python mỗi khi người dùng tương tác, việc gắn decorator `@st.cache_data` giúp dữ liệu lớn chỉ tải 1 lần duy nhất.',
      },
      {
        chapter: 'Bước 2',
        title: 'Hiển thị Bảng, Biểu đồ & Bản đồ (st.dataframe, st.bar_chart, st.map)',
        summaryVi:
          'Biến DataFrame thành biểu đồ cột theo giờ cao điểm và bản đồ tọa độ GPS tương tác.',
      },
      {
        chapter: 'Bước 3',
        title: 'Gắn Widget Lọc Tương tác (st.slider & st.checkbox)',
        summaryVi:
          'Kéo thanh trượt chọn khung giờ (0h-23h) để lọc trực tiếp bảng dữ liệu trên màn hình.',
      },
    ],
    ideFiles: [
      {
        path: 'streamlit_app/app.py',
        roleDescription:
          'Toàn bộ mã nguồn của một ứng dụng Streamlit Dashboard: tải dữ liệu có cache, lọc theo thanh trượt và vẽ biểu đồ.',
        keyPatterns: ['@st.cache_data', 'st.slider()', 'st.bar_chart()'],
        language: 'python',
        code: `"""Ứng dụng Web Dashboard tương tác viết 100% bằng Python với Streamlit."""

import pandas as pd
import streamlit as st

# Đặt tiêu đề lớn trên giao diện Web
st.title("Bảng Điều Khiển Phân Tích Chuyến Xe Theo Giờ")


# @st.cache_data giúp lưu kết quả vào bộ nhớ đệm:
# Khi người dùng kéo thanh trượt, Streamlit KHÔNG phải đọc lại file CSV từ ổ cứng!
@st.cache_data
def load_ride_data(nrows: int) -> pd.DataFrame:
    data = pd.DataFrame(
        {
            "hour": [8, 8, 9, 17, 17, 17, 18, 22],
            "lat": [21.0285, 21.0301, 21.0245, 21.0122, 21.0299, 21.0350, 21.0278, 21.0200],
            "lon": [105.8542, 105.8510, 105.8412, 105.8200, 105.8520, 105.8600, 105.8500, 105.8300],
        }
    )
    return data.head(nrows)


df = load_ride_data(1000)

# Nếu người dùng tích vào ô Checkbox thì mới hiện bảng dữ liệu thô
if st.checkbox("Hiển thị bảng dữ liệu gốc"):
    st.subheader("Dữ liệu thô")
    st.dataframe(df)

# Tạo thanh trượt từ 0h đến 23h (mặc định đang chọn 17h chiều)
selected_hour = st.slider("Chọn khung giờ cần xem trên bản đồ:", 0, 23, 17)
filtered_df = df[df["hour"] == selected_hour]

st.subheader(f"Bản đồ các điểm đón khách lúc {selected_hour}:00 ({len(filtered_df)} chuyến)")
st.map(filtered_df)`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-streamlit-run',
        label: 'Chạy Streamlit Server',
        kind: 'run',
        command: 'uv run streamlit run streamlit_app/app.py',
        description: 'Khởi chạy giao diện Web Dashboard tại cổng 8501',
        stdout: `  You can now view your Streamlit app in your browser.

  Local URL: http://localhost:8501
  Network URL: http://192.168.1.15:8501

[Cache] load_ride_data(1000) -> cached in 4.2ms
[Filter] selected_hour = 17 -> 3 matching rides rendered on map.`,
      },
    ],
  },
  {
    id: 'rw-pbl-neural-net-scratch',
    groupId: 'data-ml',
    title: 'Build Your Own Neural Net from Scratch in Python (PBL)',
    repoName: 'project-based-learning',
    url: 'https://iamtrask.github.io/2015/07/12/basic-python-network/',
    kind: 'pbl-tutorial',
    complexity: 'advanced',
    scaleLabel: 'Core Algorithm (No Black-box)',
    summary:
      'Bài viết kinh điển từ project-based-learning: tự viết mạng nơ-ron nhân tạo (Neural Network) chỉ bằng NumPy, không dùng PyTorch/TensorFlow để hiểu bản chất bên trong.',
    purpose:
      'Giúp người mới làm AI hiểu thực sự trọng số (weights), hàm kích hoạt (sigmoid) và lan truyền ngược (backpropagation) hoạt động thế nào.',
    howItWorks: [
      'Khởi tạo ma trận trọng số ngẫu nhiên bằng NumPy.',
      'Forward pass: Nhân ma trận đầu vào với trọng số và đưa qua hàm Sigmoid để tính dự đoán (0 đến 1).',
      'Tính sai số (Error = Đáp án đúng - Dự đoán).',
      'Backward pass (Gradient Descent): Nhân sai số với đạo hàm Sigmoid để biết cần chỉnh trọng số tăng hay giảm bao nhiêu.',
    ],
    directoryTree: `neural_net_scratch/
├── neural_net.py        # Toàn bộ thuật toán Forward & Backpropagation trong ~45 dòng
└── test_xor.py          # Kiểm tra độ hội tụ của mạng sau 10.000 vòng lặp`,
    libraries: [
      {
        name: 'NumPy',
        role: 'Tính toán ma trận & đại số tuyến tính tốc độ cao',
        whyNeeded:
          'Nhân ma trận `np.dot(X, weights)` trên NumPy (viết bằng C) nhanh gấp hàng trăm lần so với vòng lặp for của Python.',
      },
    ],
    readingFocus:
      'Đọc kỹ từng dòng comment trong file neural_net.py ở IDE — mỗi biến `l0`, `l1`, `l1_error`, `l1_delta` đều có chú thích ý nghĩa toán học cực dễ hiểu.',
    tags: ['PBL', 'NumPy', 'Deep Learning', 'Math'],
    chapters: [
      {
        chapter: 'Phần 1',
        title: 'Mạng Nơ-ron 2 Lớp (Forward Propagation & Sigmoid)',
        summaryVi:
          'Biểu diễn tập dữ liệu đầu vào X (ma trận 4x3) và nhãn kết quả y (4x1). Dùng hàm `sigmoid(x) = 1 / (1 + exp(-x))` ép mọi giá trị về khoảng xác suất (0, 1).',
      },
      {
        chapter: 'Phần 2',
        title: 'Lan truyền ngược (Backpropagation & Error-Weighted Derivative)',
        summaryVi:
          'Những dự đoán nào mạng đã tự tin đúng (gần 0 hoặc 1, đạo hàm nhỏ) thì ít sửa; những dự đoán nào mạng còn lưỡng lự (gần 0.5, đạo hàm lớn) và sai số cao thì cập nhật trọng số mạnh hơn.',
      },
    ],
    ideFiles: [
      {
        path: 'neural_net_scratch/neural_net.py',
        roleDescription:
          'Mạng Nơ-ron tự học hoàn chỉnh chỉ với NumPy: có chú thích tiếng Việt từng dòng giải thích Forward Pass và Backpropagation.',
        keyPatterns: ['np.dot()', 'Sigmoid Activation', 'Backpropagation'],
        language: 'python',
        code: `"""Tự xây dựng Mạng Nơ-ron (Neural Network) từ con số 0 chỉ bằng NumPy."""

import numpy as np


def sigmoid(x: np.ndarray, deriv: bool = False) -> np.ndarray:
    """Hàm kích hoạt Sigmoid: ép số bất kỳ về khoảng (0, 1).
    Nếu deriv=True: trả về đạo hàm x * (1 - x) dùng để tính độ dốc khi sửa lỗi.
    """
    if deriv:
        return x * (1.0 - x)
    return 1.0 / (1.0 + np.exp(-x))


# 1. Dữ liệu huấn luyện X (4 mẫu, mỗi mẫu 3 cột đặc trưng)
# Quy luật ẩn: Cột đầu tiên bằng bao nhiêu thì đáp án y bằng bấy nhiêu!
X = np.array([[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 1]], dtype=float)
y = np.array([[0], [0], [1], [1]], dtype=float)

# 2. Cố định seed để mỗi lần chạy đều ra cùng kết quả ngẫu nhiên ban đầu
np.random.seed(1)

# 3. Ma trận Trọng số (Synapse/Weights) kích thước (3x1) nối 3 đầu vào với 1 đầu ra
weights = 2 * np.random.random((3, 1)) - 1

# 4. Vòng lặp Huấn luyện (Training Loop)
for step in range(5000):
    # [BƯỚC TIẾN - FORWARD PASS]: Đưa dữ liệu X nhân với trọng số rồi qua hàm Sigmoid
    layer_0 = X
    layer_1 = sigmoid(np.dot(layer_0, weights))

    # [TÍNH SAI SỐ]: Đáp án thật trừ đi con số mạng vừa đoán
    layer_1_error = y - layer_1

    # [LAN TRUYỀN NGƯỢC - BACKPROPAGATION]:
    # Nhân sai số với độ dốc (đạo hàm Sigmoid tại layer_1)
    layer_1_delta = layer_1_error * sigmoid(layer_1, deriv=True)

    # [CẬP NHẬT TRỌNG SỐ]: Điều chỉnh weights để lần đoán tiếp theo chính xác hơn
    weights += np.dot(layer_0.T, layer_1_delta)

print("Dự đoán của mạng sau 5.000 vòng tự học (so với đáp án [0, 0, 1, 1]):")
print(np.round(layer_1.flatten(), 4))`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-nn-train',
        label: 'Chạy Huấn luyện Neural Net',
        kind: 'run',
        command: 'uv run python neural_net_scratch/neural_net.py',
        description: 'Huấn luyện mạng nơ-ron 5.000 bước bằng NumPy thuần',
        stdout: `Dự đoán của mạng sau 5.000 vòng tự học (so với đáp án [0, 0, 1, 1]):
[0.0136 0.011  0.991  0.9889]`,
      },
    ],
  },

  // ==========================================================================
  // 4. CÔNG CỤ DÒNG LỆNH (CLI) & BOTS
  // ==========================================================================
  {
    id: 'rw-typer-cli-template',
    groupId: 'cli-bots',
    title: 'Typer CLI Template (Modern Rich Terminal App)',
    repoName: 'youzarsiph/typer-cli-template',
    url: 'https://github.com/youzarsiph/typer-cli-template',
    kind: 'production-template',
    complexity: 'advanced',
    scaleLabel: 'Modular CLI Tool',
    summary:
      'Mẫu xây dựng công cụ dòng lệnh chuyên nghiệp với Typer và Rich: tách từng lệnh vào commands/, có màu sắc, bảng biểu và CI.',
    purpose:
      'Học cách tạo một công cụ chạy trên Terminal giống như `git` hay `uv` với nhiều lệnh con (subcommands) gọn gàng, có hướng dẫn `--help` tự động.',
    howItWorks: [
      'Người dùng gõ lệnh trên terminal -> đi vào __main__.py.',
      'Typer đọc tham số dựa trên Type Hints của hàm Python (vd: name: str, count: int = 1).',
      'Lệnh con tương ứng trong thư mục commands/ được gọi thực thi.',
      'Thư viện Rich in kết quả ra terminal kèm màu sắc, thanh tiến trình (progress bar) hoặc bảng đẹp mắt.',
    ],
    directoryTree: `my_cli/
├── src/my_cli/
│   ├── __init__.py      # Khởi tạo app Typer chính & đăng ký lệnh con
│   ├── __main__.py      # Cho phép chạy bằng: python -m my_cli
│   └── commands/        # Mỗi lệnh con là một file riêng
│       ├── inspect.py   # Lệnh: my-cli inspect
│       └── version.py   # Lệnh: my-cli version
├── tests/               # Dùng CliRunner test từng lệnh không cần gõ tay
└── pyproject.toml       # Khai báo [project.scripts] tạo lệnh toàn cục`,
    libraries: [
      {
        name: 'Typer',
        role: 'Xây dựng CLI dựa trên Type Hints',
        whyNeeded:
          'Viết hàm Python bình thường có type hint là tự động có CLI hoàn chỉnh kèm menu --help.',
      },
      {
        name: 'Rich',
        role: 'Trang trí Terminal (màu, bảng, progress bar)',
        whyNeeded:
          'Biến output chữ trắng đen nhàm chán thành giao diện terminal chuyên nghiệp, dễ đọc lỗi.',
      },
    ],
    readingFocus:
      'Xem file __init__.py và commands/inspect.py trong IDE để học cách gắn nhiều subcommands và vẽ bảng Rich Table.',
    tags: ['CLI', 'Typer', 'Rich', 'Terminal'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Tách Subcommands vào thư mục commands/',
        summaryVi:
          'Dùng `app.add_typer(sub_app, name="...")` trong `__init__.py` để chia nhỏ các nhóm lệnh lớn giống như `git remote add` hay `uv pip install`.',
      },
      {
        chapter: 'Bước 2',
        title: 'Kết hợp Rich Console & Table để hiển thị kết quả',
        summaryVi:
          'Dùng `rich.table.Table` và `rich.console.Console` để in bảng căn lề tự động có màu sắc trên Terminal.',
      },
      {
        chapter: 'Bước 3',
        title: 'Kiểm thử CLI tự động bằng Typer CliRunner',
        summaryVi:
          'Dùng `CliRunner().invoke(app, ["inspect", "--env", "prod"])` trong pytest để kiểm tra cả exit_code lẫn nội dung stdout.',
      },
    ],
    ideFiles: [
      {
        path: 'src/my_cli/__init__.py',
        roleDescription:
          'Khởi tạo ứng dụng Typer gốc và đăng ký các nhóm lệnh con từ thư mục commands/.',
        keyPatterns: ['typer.Typer()', 'app.command()', 'Subcommands'],
        language: 'python',
        code: `"""Khởi tạo ứng dụng CLI chính với Typer và Rich."""

import typer
from my_cli.commands.inspect_cmd import inspect_service

# no_args_is_help=True: nếu người dùng chỉ gõ tên lệnh mà không truyền gì -> tự hiện bảng hướng dẫn
app = typer.Typer(
    name="devops-cli",
    help="Công cụ dòng lệnh quản trị dịch vụ chuẩn kỹ sư Python.",
    no_args_is_help=True,
)

# Đăng ký hàm inspect_service thành lệnh con: devops-cli inspect
app.command(name="inspect")(inspect_service)`,
      },
      {
        path: 'src/my_cli/commands/inspect_cmd.py',
        roleDescription:
          'Định nghĩa lệnh con inspect sử dụng Type Hints để nhận cờ (--env, --verbose) và dùng thư viện Rich vẽ bảng trạng thái.',
        keyPatterns: ['typer.Option', 'rich.table.Table', 'rich.console.Console'],
        language: 'python',
        code: `"""Lệnh con 'inspect' hiển thị bảng trạng thái hệ thống bằng thư viện Rich."""

import typer
# Console và Table của thư viện Rich giúp vẽ bảng có khung viền và màu sắc trên Terminal
from rich.console import Console
from rich.table import Table

console = Console()


def inspect_service(
    service_name: str = typer.Argument(..., help="Tên dịch vụ cần kiểm tra"),
    env: str = typer.Option("prod", "--env", "-e", help="Môi trường: dev / staging / prod"),
) -> None:
    """Kiểm tra thông số sức khỏe của một dịch vụ và in bảng Rich Table."""
    table = Table(title=f"Trạng thái dịch vụ: {service_name} ({env.upper()})")
    table.add_column("Thành phần", style="cyan", no_wrap=True)
    table.add_column("Trạng thái", style="green")
    table.add_column("Độ trễ", justify="right", style="amber")

    table.add_row("FastAPI Gateway", "ONLINE", "8 ms")
    table.add_row("PostgreSQL Primary", "ONLINE", "3 ms")
    table.add_row("Redis Cache", "ONLINE", "1 ms")

    console.print(table)`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-typer-run',
        label: 'Chạy devops-cli inspect',
        kind: 'run',
        command: 'uv run devops-cli inspect order-api --env prod',
        description: 'Hiển thị bảng trạng thái dịch vụ bằng Typer + Rich',
        stdout: `       Trạng thái dịch vụ: order-api (PROD)       
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━┓
┃ Thành phần         ┃ Trạng thái ┃ Độ trễ ┃
┡━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━╇━━━━━━━━┩
│ FastAPI Gateway    │ ONLINE     │   8 ms │
│ PostgreSQL Primary │ ONLINE     │   3 ms │
│ Redis Cache        │ ONLINE     │   1 ms │
└────────────────────┴────────────┴────────┘`,
      },
    ],
  },
  {
    id: 'rw-py-cli-template',
    groupId: 'cli-bots',
    title: 'Py CLI Template (Click + uv + Pydantic + Ruff)',
    repoName: 'KyleStiers/py_cli_template',
    url: 'https://github.com/KyleStiers/py_cli_template',
    kind: 'production-template',
    complexity: 'advanced',
    scaleLabel: 'Lightweight CLI Package',
    summary:
      'Mẫu CLI gọn nhẹ kết hợp Click, uv, Pydantic và Ruff, minh họa chuẩn mực đóng gói lệnh hệ thống qua pyproject.toml.',
    purpose:
      'Giúp bạn nắm trọn bộ công cụ Python hiện đại nhất (uv + Ruff + Pydantic) áp dụng vào một CLI tool thực tế.',
    howItWorks: [
      'Mục [project.scripts] trong pyproject.toml trỏ tên lệnh tới hàm entrypoint.',
      'Click phân tích cờ (--flag) và tham số dòng lệnh.',
      'Pydantic kiểm tra cấu hình/dữ liệu trước khi thực thi logic.',
    ],
    directoryTree: `py_cli_template/
├── src/package_name/
│   ├── cli.py           # Định nghĩa lệnh Click (@click.command)
│   └── core.py          # Logic chính tách khỏi CLI + Pydantic model
├── tests/               # Kiểm thử CLI với pytest
└── pyproject.toml       # Khai báo uv, ruff và [project.scripts]`,
    libraries: [
      {
        name: 'Click',
        role: 'Thư viện CLI lâu đời, cực kỳ ổn định',
        whyNeeded:
          'Typer thực chất được xây bên trên Click; biết Click giúp bạn hiểu sâu cách CLI xử lý options/arguments bằng decorator.',
      },
      {
        name: 'uv + Ruff',
        role: 'Quản lý gói & Linter/Formatter siêu tốc',
        whyNeeded:
          'uv thay thế pip/venv nhanh gấp 10-100 lần; Ruff thay thế flake8/black để soi lỗi code tức thì.',
      },
    ],
    readingFocus:
      'Mở pyproject.toml và src/package_name/cli.py trong IDE để xem cách [project.scripts] biến hàm Python thành lệnh terminal.',
    tags: ['CLI', 'Click', 'uv', 'Ruff'],
    ideFiles: [
      {
        path: 'pyproject.toml',
        roleDescription:
          'Khai báo metadata chuẩn PEP 621, tạo lệnh hệ thống trong [project.scripts] và cấu hình bộ kiểm tra code Ruff.',
        keyPatterns: ['[project.scripts]', '[tool.ruff]'],
        language: 'toml',
        code: `[project]
name = "py-cli-tool"
version = "0.1.0"
description = "Mẫu CLI gọn nhẹ với Click, Pydantic, uv và Ruff"
requires-python = ">=3.12"
dependencies = [
    "click>=8.1.7",
    "pydantic>=2.7.0",
]

[project.scripts]
# Khi cài package này, người dùng có thể gõ trực tiếp lệnh "py-tool" trên Terminal
py-tool = "package_name.cli:main"

[tool.ruff]
line-length = 100
target-version = "py312"`,
      },
      {
        path: 'src/package_name/cli.py',
        roleDescription:
          'Sử dụng decorator @click.command() và @click.option() để nhận tham số dòng lệnh và xác thực bằng Pydantic.',
        keyPatterns: ['@click.command', '@click.option', 'Pydantic Validation'],
        language: 'python',
        code: `"""Định nghĩa giao diện dòng lệnh với Click kết hợp kiểm tra dữ liệu bằng Pydantic."""

import click
from pydantic import BaseModel, Field


class JobConfig(BaseModel):
    """Pydantic đảm bảo số luồng workers luôn nằm trong khoảng an toàn (1..32)."""

    task_name: str = Field(..., min_length=2)
    workers: int = Field(default=4, ge=1, le=32)


@click.command()
@click.argument("task_name")
@click.option("--workers", "-w", default=4, help="Số tiến trình xử lý song song (1-32).")
def main(task_name: str, workers: int) -> None:
    """Thực thi tác vụ TASK_NAME với cấu hình đã được Pydantic kiểm duyệt."""
    cfg = JobConfig(task_name=task_name, workers=workers)
    click.echo(f"[OK] Khởi chạy tác vụ '{cfg.task_name}' với {cfg.workers} workers!")`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-click-run',
        label: 'Chạy py-tool',
        kind: 'run',
        command: 'uv run py-tool sync-users --workers 8',
        description: 'Gọi lệnh CLI được khai báo trong pyproject.toml',
        stdout: `[OK] Khởi chạy tác vụ 'sync-users' với 8 workers!`,
      },
    ],
  },
  {
    id: 'rw-pbl-telegram-bot',
    groupId: 'cli-bots',
    title: 'How To Create a Telegram Bot Using Python (PBL)',
    repoName: 'python-telegram-bot/python-telegram-bot',
    url: 'https://docs.python-telegram-bot.org/en/stable/examples.echobot.html',
    kind: 'pbl-tutorial',
    complexity: 'basic',
    scaleLabel: 'Automation Bot (Tự code)',
    summary:
      'Tự tạo con Bot Telegram biết nhận tin nhắn, trả lời lệnh (/start, /price...) và gửi thông báo tự động.',
    purpose:
      'Là bài thực hành cực hay cho người mới để hiểu khái niệm API Token, Webhook/Polling và xử lý sự kiện tin nhắn bất đồng bộ.',
    howItWorks: [
      'Xin Token từ @BotFather trên Telegram và lưu vào biến môi trường (tuyệt đối không hardcode!).',
      'Script Python liên tục hỏi server Telegram xem có tin nhắn mới không (Polling) hoặc lắng nghe Webhook.',
      'Khi có lệnh /start hoặc tin nhắn văn bản, hàm async handler tương ứng chạy và gửi phản hồi lại khung chat.',
    ],
    directoryTree: `telegram_bot/
├── bot.py               # Đăng ký các CommandHandler và chạy run_polling()
├── handlers.py          # Hàm async xử lý từng lệnh (/start, /help, /todo)
├── .env                 # Lưu TELEGRAM_BOT_TOKEN bí mật (được .gitignore bỏ qua)
└── requirements.txt     # python-telegram-bot, python-dotenv`,
    libraries: [
      {
        name: 'python-telegram-bot (v20+ Async)',
        role: 'Giao tiếp bất đồng bộ với Telegram Bot API',
        whyNeeded:
          'Gói gọn các HTTP request phức tạp thành các hàm đơn giản như `await update.message.reply_text(...)`.',
      },
      {
        name: 'python-dotenv',
        role: 'Đọc file .env chứa API Key bí mật',
        whyNeeded:
          'Giúp bạn không vô tình đẩy Token/Mật khẩu lên GitHub công khai.',
      },
    ],
    readingFocus:
      'Xem file bot.py trong IDE để hiểu mô hình Event-Driven: mỗi lệnh `/start` của người dùng sẽ kích hoạt hàm callback tương ứng.',
    tags: ['PBL', 'Telegram Bot', 'Automation', 'AsyncIO'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Lấy Bot Token từ @BotFather & Bảo mật với .env',
        summaryVi:
          'Chat với @BotFather trên Telegram, gõ `/newbot` để nhận chuỗi token và nạp vào Python qua `os.getenv("TELEGRAM_BOT_TOKEN")`.',
      },
      {
        chapter: 'Bước 2',
        title: 'Viết Async CommandHandler (/start, /status)',
        summaryVi:
          'Mỗi hàm xử lý nhận 2 tham số `(update: Update, context: ContextTypes.DEFAULT_TYPE)` để biết ai vừa nhắn tin và nội dung là gì.',
      },
      {
        chapter: 'Bước 3',
        title: 'Khởi chạy vòng lặp Application.builder().token(...).build()',
        summaryVi:
          'Gắn các handler vào Application và gọi `app.run_polling()` để bot thức trực 24/7.',
      },
    ],
    ideFiles: [
      {
        path: 'telegram_bot/bot.py',
        roleDescription:
          'Mã nguồn hoàn chỉnh của một Bot Telegram hiện đại (chuẩn async/await) có chú thích tiếng Việt từng phần cho người mới.',
        keyPatterns: ['Application.builder()', 'CommandHandler', 'async/await'],
        language: 'python',
        code: `"""Tự xây dựng Telegram Bot bất đồng bộ (Giải thích chi tiết cho người mới)."""

import os
# Application, CommandHandler giúp gắn các lệnh như /start, /help vào hàm Python
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Hàm tự động chạy khi người dùng gõ lệnh /start trong khung chat với Bot."""
    user = update.effective_user
    name = user.first_name if user else "bạn"
    if update.message:
        await update.message.reply_text(
            f"Xin chào {name}! Tôi là Python Automation Bot.\n"
            "Hãy gõ /status để kiểm tra sức khỏe máy chủ."
        )


async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Hàm tự động chạy khi người dùng gõ lệnh /status."""
    if update.message:
        await update.message.reply_text(
            "✅ Hệ thống hoạt động bình thường:\n- CPU: 14%\n- RAM: 1.2GB / 4GB"
        )


def main() -> None:
    # Đọc Token bí mật từ biến môi trường (Không bao giờ viết cứng token thật vào code!)
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "DEMO_TOKEN_FROM_ENV")

    # Khởi tạo ứng dụng Bot và đăng ký các lệnh
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("status", status_command))

    print("Bot đã sẵn sàng lắng nghe tin nhắn (Polling)...")
    # app.run_polling() sẽ giữ chương trình chạy liên tục để đón tin nhắn mới


if __name__ == "__main__":
    main()`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-bot-run',
        label: 'Khởi chạy Telegram Bot',
        kind: 'run',
        command: 'uv run python telegram_bot/bot.py',
        description: 'Khởi động Bot lắng nghe lệnh /start và /status',
        stdout: `Bot đã sẵn sàng lắng nghe tin nhắn (Polling)...
[Incoming Update] chat_id=849201 user="Skyline" text="/start"
[Bot Reply] Xin chào Skyline! Tôi là Python Automation Bot.
[Incoming Update] chat_id=849201 user="Skyline" text="/status"
[Bot Reply] ✅ Hệ thống hoạt động bình thường: CPU 14%, RAM 1.2GB / 4GB`,
      },
    ],
  },

  // ==========================================================================
  // 5. LIBRARY / PACKAGE CHUẨN HIỆN ĐẠI & DEVCONTAINER
  // ==========================================================================
  {
    id: 'rw-robs-awesome-template',
    groupId: 'library-devops',
    title: "Rob's Awesome Python Template (Từ Tối giản đến Full App)",
    repoName: 'tedivm/robs_awesome_python_template',
    url: 'https://github.com/tedivm/robs_awesome_python_template',
    kind: 'production-template',
    complexity: 'advanced',
    scaleLabel: 'Multi-Tier Reference',
    summary:
      'Kho mẫu hiếm có cho phép so sánh cấu trúc dự án thay đổi thế nào từ một script nhỏ, đến thư viện, rồi đến Full-stack App (FastAPI + SQLAlchemy + Celery + Docker + uv).',
    purpose:
      'Giúp người mới trả lời câu hỏi: "Dự án nhỏ thì tổ chức thế nào, còn dự án lớn thì mở rộng thư mục ra sao cho hợp lý?"',
    howItWorks: [
      'Repo chia sẵn các nhánh/ví dụ theo quy mô: Minimal, Library/CLI và Full Application.',
      'Dùng uv quản lý môi trường và pyproject.toml làm trung tâm.',
      'Phần Full App kết nối sẵn FastAPI (API) + SQLAlchemy (DB) + Celery (Worker) trong Docker.',
    ],
    directoryTree: `robs_awesome_python_template/
├── src/                 # Mã nguồn chính theo chuẩn src-layout
├── tests/               # Bộ test pytest
├── Dockerfile           # Đóng gói ứng dụng thành container chạy mọi nơi
├── docker-compose.yml   # Bật kèm Database & Worker
└── pyproject.toml       # Quản lý dependencies, build & tool config`,
    libraries: [
      {
        name: 'uv',
        role: 'Quản lý Python version, venv & lockfile',
        whyNeeded:
          'Đảm bảo code chạy trên máy bạn và máy đồng đội cài đúng 100% phiên bản thư viện giống nhau.',
      },
      {
        name: 'pytest',
        role: 'Framework kiểm thử chuẩn của Python',
        whyNeeded:
          'Cú pháp ngắn gọn, chỉ cần dùng từ khóa `assert` để kiểm tra code đúng hay sai.',
      },
    ],
    readingFocus:
      'So sánh file cấu trúc của ví dụ Minimal với ví dụ Full Application để thấy sự tiến hóa kiến trúc.',
    tags: ['Template', 'uv', 'Docker', 'Best Practices'],
    ideFiles: [
      {
        path: 'pyproject.toml',
        roleDescription:
          'File cấu hình chuẩn kết hợp uv, pytest, ruff và mypy cho một package Python hiện đại.',
        keyPatterns: ['PEP 621', 'dependency-groups', 'pytest & mypy'],
        language: 'toml',
        code: `[project]
name = "awesome-python-service"
version = "0.2.0"
description = "Cấu trúc chuẩn dự án Python từ thư viện nhỏ tới dịch vụ hoàn chỉnh"
requires-python = ">=3.12"
dependencies = [
    "pydantic>=2.8.0",
]

[dependency-groups]
# Các thư viện chỉ dùng lúc lập trình & kiểm thử (không cài lên server production)
dev = [
    "pytest>=8.2.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
]

[tool.pytest.ini_options]
pythonpath = ["src"]
testpaths = ["tests"]`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-robs-test',
        label: 'Chạy uv run pytest',
        kind: 'pytest',
        command: 'uv run pytest',
        description: 'Chạy bộ kiểm thử tự động trong môi trường uv',
        stdout: `============================= test session starts ==============================
collected 3 items

tests/test_core.py ...                                                   [100%]

============================== 3 passed in 0.02s ===============================`,
      },
    ],
  },
  {
    id: 'rw-solita-production-template',
    groupId: 'library-devops',
    title: 'Solita Production-Ready Python Template',
    repoName: 'solita/production-ready-python-template',
    url: 'https://github.com/solita/production-ready-python-template',
    kind: 'production-template',
    complexity: 'pro',
    scaleLabel: 'DevOps & Engineering Standard',
    summary:
      'Mẫu dự án thiên về thực hành kỹ thuật phần mềm hiện đại: Dev Containers, Docker multi-stage build, uv, pre-commit, type hints và pytest.',
    purpose:
      'Cho thấy một công ty phần mềm chuyên nghiệp thiết lập "hàng rào chất lượng" (lint, format, type check, test) tự động như thế nào.',
    howItWorks: [
      'Mở dự án bằng VS Code DevContainer -> tự động dựng sẵn môi trường Python giống hệt server.',
      'Trước mỗi lần `git commit`, `pre-commit` tự chạy Ruff & kiểm tra lỗi kiểu dữ liệu (Mypy/Pyright).',
      'Dockerfile dùng kỹ thuật Multi-stage build để tạo image cuối cùng siêu nhẹ, bảo mật.',
    ],
    directoryTree: `production-ready-python-template/
├── .devcontainer/       # Cấu hình môi trường code chuẩn trong Docker cho VS Code
├── .pre-commit-config.yaml # Tự động kiểm tra code trước khi git commit
├── src/                 # Mã nguồn module gọn, tách biệt, dễ unit test
├── tests/               # Kiểm thử tự động
├── Dockerfile           # Multi-stage build tối ưu dung lượng image
└── pyproject.toml       # Cấu hình uv, pytest, linter`,
    libraries: [
      {
        name: 'pre-commit',
        role: 'Chạy kiểm tra tự động trước khi commit code',
        whyNeeded:
          'Ngăn không cho code lỗi cú pháp, chưa format hoặc dính key bí mật lọt vào Git.',
      },
      {
        name: 'Docker Multi-stage Build',
        role: 'Tách bước cài đặt (builder) và bước chạy thật (runtime)',
        whyNeeded:
          'Giúp image Docker cuối cùng nhỏ gọn và chạy dưới quyền user thường (non-root) an toàn.',
      },
    ],
    readingFocus:
      'Đọc Dockerfile trong IDE để hiểu kỹ thuật Multi-stage build với uv và non-root user.',
    tags: ['DevContainer', 'Docker', 'pre-commit', 'CI/CD'],
    ideFiles: [
      {
        path: 'Dockerfile',
        roleDescription:
          'Dockerfile chuẩn Production dùng kỹ thuật Multi-stage build với uv và chạy dưới quyền user không phải root để bảo mật.',
        keyPatterns: ['Multi-stage Build', 'uv sync --frozen', 'Non-root User'],
        language: 'dockerfile',
        code: `# --- GIAI ĐOẠN 1: BUILDER (Cài đặt thư viện bằng uv) ---
FROM python:3.12-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
COPY pyproject.toml uv.lock ./
# --frozen đảm bảo cài đúng 100% phiên bản trong uv.lock, --no-dev bỏ qua thư viện test
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev

# --- GIAI ĐOẠN 2: RUNTIME (Image chạy thật nhẹ & bảo mật) ---
FROM python:3.12-slim AS runtime
# Tạo tài khoản appuser quyền hạn thấp (tránh chạy bằng root nguy hiểm khi bị tấn công)
RUN useradd --create-home appuser
WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src /app/src
ENV PATH="/app/.venv/bin:$PATH"

USER appuser
CMD ["python", "-m", "my_service.main"]`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-solita-lint',
        label: 'Chạy pre-commit & Ruff',
        kind: 'lint',
        command: 'uv run ruff check src/ && uv run pytest',
        description: 'Kiểm tra chất lượng code (Ruff linter) và chạy Unit Test',
        stdout: `All checks passed!
============================= test session starts ==============================
collected 5 items

tests/test_app.py .....                                                  [100%]

============================== 5 passed in 0.03s ===============================`,
      },
    ],
  },
];
