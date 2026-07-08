import { postRequest, getRequest } from "./client";

const LOCAL_SEARCH_HISTORY_KEY = "__local_search_history";
const LOCAL_PREDICT_HISTORY_KEY = "__local_predict_history";

export interface SearchHistoryEntry {
  type: "search";
  searchName: string;
  diseaseName: string;
  result: any[];
  symptoms?: string[];   // triệu chứng liên quan (cập nhật sau khi xem detail)
  createdAt: string;
}

export interface PredictHistoryEntry {
  type: "predict";
  inputSymptoms: string[];
  result: any;
  createdAt: string;
}

function loadLocalHistory(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function getItemKey(item: any): string {
  // Predict history: dedup theo triệu chứng + bệnh đã chọn
  if (item.type === "predict" || item.inputSymptoms) {
    const symptoms = (item.inputSymptoms || []).join(",");
    const disease = item.result?.[0]?.name_vi || item.result?.[0]?.name || "";
    return `predict:${symptoms}:${disease}`.toLowerCase().trim();
  }
  // Search history: dedup theo tên bệnh
  return (
    item.diseaseName ||
    item.searchName ||
    item.name ||
    JSON.stringify(item)
  ).toLowerCase().trim();
}

function saveLocalHistoryItem(key: string, item: any, limit = 50): boolean {
  try {
    const arr = loadLocalHistory(key);
    const newKey = getItemKey(item);
    // Xoá bản cũ nếu cùng tên bệnh (sẽ đẩy bản mới lên đầu với timestamp mới)
    const filtered = arr.filter((v: any) => getItemKey(v) !== newKey);
    filtered.unshift(item);
    const truncated = filtered.slice(0, limit);
    localStorage.setItem(key, JSON.stringify(truncated));
    return true;
  } catch {
    return false;
  }
}

export async function getSearchHistory() {
  try {
    const res = await getRequest("/api/diseases/search/history");
    const serverData = (res && res.data) || [];
    const local = loadLocalHistory(LOCAL_SEARCH_HISTORY_KEY) || [];
    const combined = [...local, ...serverData];
    return {
      message: res?.message || "Lịch sử tìm kiếm",
      count: combined.length,
      data: combined,
    };
  } catch {
    const local = loadLocalHistory(LOCAL_SEARCH_HISTORY_KEY) || [];
    return {
      message: "Lịch sử tìm kiếm (local)",
      count: local.length,
      data: local,
    };
  }
}

export async function getPredictHistory() {
  try {
    const res = await getRequest("/api/symptoms/history");
    const serverData = (res && res.data) || [];
    const local = loadLocalHistory(LOCAL_PREDICT_HISTORY_KEY) || [];
    const combined = [...local, ...serverData];
    return {
      message: res?.message || "Lịch sử chẩn đoán",
      count: combined.length,
      data: combined,
    };
  } catch {
    const local = loadLocalHistory(LOCAL_PREDICT_HISTORY_KEY) || [];
    return {
      message: "Lịch sử chẩn đoán (local)",
      count: local.length,
      data: local,
    };
  }
}

export async function syncSearchHistoryToServer() {
  try {
    const local = loadLocalHistory(LOCAL_SEARCH_HISTORY_KEY) || [];
    if (local.length === 0) return true;

    await Promise.all(
      local.map((entry) =>
        postRequest("/api/diseases/search/history", {
          searchName: entry.searchName || "",
          diseaseName: entry.diseaseName || "",
          result: entry.result || [],
          createdAt: entry.createdAt || new Date().toISOString(),
        }).catch((e) => console.warn("[syncSearchHistory] Failed entry:", e))
      )
    );

    localStorage.removeItem(LOCAL_SEARCH_HISTORY_KEY);
    return true;
  } catch (err) {
    console.error("[syncSearchHistory] Error:", err);
    return false;
  }
}

export async function syncPredictHistoryToServer() {
  try {
    const local = loadLocalHistory(LOCAL_PREDICT_HISTORY_KEY) || [];
    if (local.length === 0) return true;

    await Promise.all(
      local.map((entry) =>
        postRequest("/api/symptoms/history", {
          inputSymptoms: entry.inputSymptoms || [],
          result: entry.result || [],
          createdAt: entry.createdAt || new Date().toISOString(),
        }).catch((e) => console.warn("[syncPredictHistory] Failed entry:", e))
      )
    );

    localStorage.removeItem(LOCAL_PREDICT_HISTORY_KEY);
    return true;
  } catch (err) {
    console.error("[syncPredictHistory] Error:", err);
    return false;
  }
}

export function saveLocalSearchHistory(entry: SearchHistoryEntry) {
  return saveLocalHistoryItem(LOCAL_SEARCH_HISTORY_KEY, entry);
}

export function saveLocalPredictHistory(entry: PredictHistoryEntry) {
  return saveLocalHistoryItem(LOCAL_PREDICT_HISTORY_KEY, entry);
}

/**
 * Cập nhật triệu chứng liên quan vào entry history theo tên bệnh.
 * Được gọi từ DiseaseDetail sau khi load xong chi tiết bệnh.
 */
export function updateSearchHistorySymptoms(diseaseName: string, symptoms: string[]) {
  try {
    const arr = loadLocalHistory(LOCAL_SEARCH_HISTORY_KEY);
    const key = diseaseName.toLowerCase().trim();
    let updated = false;
    const newArr = arr.map((entry: any) => {
      const entryKey = (entry.diseaseName || entry.searchName || entry.name || "").toLowerCase().trim();
      if (entryKey === key) {
        updated = true;
        return { ...entry, symptoms };
      }
      return entry;
    });
    if (updated) {
      localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(newArr));
    }
  } catch {
    // silent
  }
}
