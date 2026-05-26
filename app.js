const STORAGE_KEY = "mobie-records";
const seedRecords = [
  { id: 1, title: "인터스텔라", type: "영화", genre: "SF", rating: 5, status: "완료", review: "우주와 가족 이야기가 오래 남는 작품", recommended: true, recommendReason: "영상미와 감정선이 모두 강해서 추천하고 싶다.", createdAt: "2026-05-26T09:00:00.000Z", updatedAt: "2026-05-26T09:00:00.000Z" },
  { id: 2, title: "어린 왕자", type: "책", genre: "소설", rating: 4, status: "완료", review: "짧지만 다시 읽을 때마다 다른 느낌을 준다.", recommended: true, recommendReason: "가볍게 읽히지만 생각할 거리가 많다.", createdAt: "2026-05-26T09:05:00.000Z", updatedAt: "2026-05-26T09:05:00.000Z" },
  { id: 3, title: "기생충", type: "영화", genre: "드라마", rating: 4, status: "보는 중", review: "사회적 메시지가 인상적이다.", recommended: true, recommendReason: "장면마다 해석할 요소가 많다.", createdAt: "2026-05-26T09:10:00.000Z", updatedAt: "2026-05-26T09:10:00.000Z" },
  { id: 4, title: "라라랜드", type: "영화", genre: "로맨스", rating: 3, status: "보고 싶음", review: "음악과 색감이 궁금한 작품", recommended: false, recommendReason: "", createdAt: "2026-05-26T09:15:00.000Z", updatedAt: "2026-05-26T09:15:00.000Z" }
];

let records = loadRecords();
let activeFilter = "all";
let selectedGenre = "all";
let sortMode = "latest";
let selectedRecordId = null;

const $ = (selector) => document.querySelector(selector);
const recordList = $("#recordList");
const recommendList = $("#recommendList");
const genreSelect = $("#genreSelect");
const sortSelect = $("#sortSelect");
const filterButtons = document.querySelectorAll("[data-filter]");
const recordDialog = $("#recordDialog");
const detailDialog = $("#detailDialog");
const recordForm = $("#recordForm");
const formTitle = $("#formTitle");
const formError = $("#formError");
const fields = {
  id: $("#recordId"),
  title: $("#titleInput"),
  type: $("#typeInput"),
  genre: $("#genreInput"),
  rating: $("#ratingInput"),
  status: $("#statusInput"),
  review: $("#reviewInput"),
  recommended: $("#recommendedInput"),
  recommendReason: $("#recommendReasonInput")
};

function loadRecords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRecords));
    return [...seedRecords];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [...seedRecords];
  } catch {
    return [...seedRecords];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function render() {
  $("#totalCount").textContent = records.length;
  $("#recommendCount").textContent = records.filter((record) => record.rating >= 4).length;
  const average = records.length ? records.reduce((sum, record) => sum + record.rating, 0) / records.length : 0;
  $("#averageRating").textContent = average.toFixed(1);
  renderGenreOptions();
  renderRecords();
  renderRecommendations();
}

function renderGenreOptions() {
  const genres = [...new Set(records.map((record) => record.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  const current = genreSelect.value || selectedGenre;
  genreSelect.innerHTML = `<option value="all">전체</option>${genres.map((genre) => `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`).join("")}`;
  genreSelect.value = genres.includes(current) ? current : "all";
  selectedGenre = genreSelect.value;
}

function sortRecords(list) {
  return [...list].sort((a, b) => {
    if (sortMode === "rating") return b.rating - a.rating || a.title.localeCompare(b.title, "ko");
    if (sortMode === "title") return a.title.localeCompare(b.title, "ko");
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function renderRecords() {
  const filtered = sortRecords(records.filter((record) => activeFilter === "all" || record.type === activeFilter));
  if (!filtered.length) {
    recordList.innerHTML = `<div class="empty-state">조건에 맞는 기록이 없습니다. 새 영화나 책 기록을 추가해보세요.</div>`;
    return;
  }
  recordList.innerHTML = filtered.map(createRecordCard).join("");
}

function createRecordCard(record) {
  const badgeClass = record.type === "영화" ? "movie" : "book";
  return `
    <article class="record-card">
      <div>
        <div class="record-title">
          <h3>${escapeHtml(record.title)}</h3>
          <span class="badge ${badgeClass}">${escapeHtml(record.type)}</span>
        </div>
        <div class="record-meta">
          <span>${escapeHtml(record.genre)}</span>
          <span>별점 ${record.rating}</span>
          <span>${escapeHtml(record.status)}</span>
          ${record.recommended ? "<span>추천 표시</span>" : ""}
        </div>
        <p class="record-review">"${escapeHtml(record.review)}"</p>
      </div>
      <div class="record-actions">
        <button class="small-button" type="button" data-action="detail" data-id="${record.id}">상세</button>
        <button class="small-button" type="button" data-action="edit" data-id="${record.id}">수정</button>
      </div>
    </article>`;
}

function renderRecommendations() {
  const recommendations = sortRecords(records.filter((record) => record.rating >= 4 && (selectedGenre === "all" || record.genre === selectedGenre)));
  if (!recommendations.length) {
    recommendList.innerHTML = `<div class="empty-state">추천 기준에 맞는 기록이 없습니다. 별점 4점 이상 기록을 추가해보세요.</div>`;
    return;
  }
  recommendList.innerHTML = recommendations.map((record) => `
    <article class="recommend-card">
      <h3>${escapeHtml(record.title)}</h3>
      <div class="recommend-meta">
        <span>${escapeHtml(record.type)}</span>
        <span>${escapeHtml(record.genre)}</span>
        <span>별점 ${record.rating}</span>
      </div>
      <p>${escapeHtml(record.recommendReason || record.review)}</p>
    </article>`).join("");
}

function openForm(record = null) {
  formError.textContent = "";
  recordForm.reset();
  if (record) {
    formTitle.textContent = "기록 수정";
    fields.id.value = record.id;
    fields.title.value = record.title;
    fields.type.value = record.type;
    fields.genre.value = record.genre;
    fields.rating.value = String(record.rating);
    fields.status.value = record.status;
    fields.review.value = record.review;
    fields.recommended.checked = record.recommended;
    fields.recommendReason.value = record.recommendReason || "";
  } else {
    formTitle.textContent = "기록 추가";
    fields.id.value = "";
    fields.rating.value = "5";
    fields.status.value = "보고 싶음";
  }
  recordDialog.showModal();
}

function handleSubmit(event) {
  event.preventDefault();
  const title = fields.title.value.trim();
  const genre = fields.genre.value.trim();
  const review = fields.review.value.trim();
  const recommendReason = fields.recommendReason.value.trim();
  if (!title || !genre || !review) {
    formError.textContent = "제목, 장르, 한 줄 감상평은 반드시 입력해야 합니다.";
    return;
  }
  if (fields.recommended.checked && !recommendReason) {
    formError.textContent = "추천 여부를 선택했다면 추천 이유를 입력해주세요.";
    return;
  }
  const now = new Date().toISOString();
  const existingId = fields.id.value ? Number(fields.id.value) : null;
  const payload = {
    id: existingId || (records.length ? Math.max(...records.map((record) => record.id)) + 1 : 1),
    title,
    type: fields.type.value,
    genre,
    rating: Number(fields.rating.value),
    status: fields.status.value,
    review,
    recommended: fields.recommended.checked,
    recommendReason,
    createdAt: existingId ? records.find((record) => record.id === existingId)?.createdAt || now : now,
    updatedAt: now
  };
  records = existingId ? records.map((record) => (record.id === existingId ? payload : record)) : [payload, ...records];
  saveRecords();
  recordDialog.close();
  render();
}

function openDetail(recordId) {
  const record = records.find((item) => item.id === recordId);
  if (!record) return;
  selectedRecordId = recordId;
  $("#detailType").textContent = record.type;
  $("#detailTitle").textContent = record.title;
  $("#detailGenre").textContent = record.genre;
  $("#detailRating").textContent = `${record.rating}점`;
  $("#detailStatus").textContent = record.status;
  $("#detailRecommended").textContent = record.recommended ? "추천" : "미추천";
  $("#detailReview").textContent = record.review;
  $("#detailReason").textContent = record.recommendReason || "작성된 추천 이유가 없습니다.";
  detailDialog.showModal();
}

function deleteSelectedRecord() {
  const record = records.find((item) => item.id === selectedRecordId);
  if (!record || !window.confirm(`"${record.title}" 기록을 삭제할까요?`)) return;
  records = records.filter((item) => item.id !== selectedRecordId);
  selectedRecordId = null;
  saveRecords();
  detailDialog.close();
  render();
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

$("#openAddForm").addEventListener("click", () => openForm());
$("#closeDialog").addEventListener("click", () => recordDialog.close());
$("#cancelForm").addEventListener("click", () => recordDialog.close());
$("#closeDetail").addEventListener("click", () => detailDialog.close());
$("#editRecord").addEventListener("click", () => {
  const record = records.find((item) => item.id === selectedRecordId);
  if (!record) return;
  detailDialog.close();
  openForm(record);
});
$("#deleteRecord").addEventListener("click", deleteSelectedRecord);
recordForm.addEventListener("submit", handleSubmit);
sortSelect.addEventListener("change", (event) => {
  sortMode = event.target.value;
  renderRecords();
  renderRecommendations();
});
genreSelect.addEventListener("change", (event) => {
  selectedGenre = event.target.value;
  renderRecommendations();
});
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderRecords();
  });
});
recordList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const recordId = Number(button.dataset.id);
  const record = records.find((item) => item.id === recordId);
  if (!record) return;
  if (button.dataset.action === "detail") openDetail(recordId);
  if (button.dataset.action === "edit") openForm(record);
});

render();
