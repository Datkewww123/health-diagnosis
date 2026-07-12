if (!import.meta.env.VITE_API_URL) {
  console.warn("[api] VITE_API_URL not set, falling back to http://localhost:3001");
}

export const baseURL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

export function setToken(t: string | null) {
  if (t) {
    localStorage.setItem("token", t);
  } else {
    localStorage.removeItem("token");
  }
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function postRequest<T = any>(path: string, data: any = {}, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let attempt = 0;
  while (attempt < 2) {
    const attemptController = attempt === 0 ? controller : new AbortController();
    const attemptTimeout = attempt === 0 ? timeout : setTimeout(() => attemptController.abort(), 10000);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };
      const authToken = getToken();
      if (authToken) {
        (headers as Record<string, string>).Authorization = `Bearer ${authToken}`;
      }

      const res = await fetch(baseURL + path, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: attemptController.signal,
        ...options,
      });

      clearTimeout(attemptTimeout);
      if (!res.ok) {
        let msg = `HTTP error! status: ${res.status}`;
        try {
          const err = await res.json();
          msg = err.message || msg;
        } catch {
          // ignore parse error
        }
        
        // Tự động đăng xuất nếu Token hết hạn/không hợp lệ (HTTP 401)
        // Bỏ qua endpoint login vì 401 ở đây là sai tài khoản/khẩu, không phải token hết hạn
        if (res.status === 401 && !path.includes("/api/auth/login")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          setToken(null);
          window.dispatchEvent(new CustomEvent("auth-change", { detail: { role: "user" } }));
          setTimeout(() => {
            window.location.href = "/login";
          }, 500);
        }

        const httpErr = new Error(msg) as any;
        httpErr.status = res.status;
        throw httpErr;
      }
      try {
        return await res.json();
      } catch {
        console.error(`[API] Failed to parse response from ${path}`);
        return {} as T;
      }
    } catch (err: any) {
      clearTimeout(attemptTimeout);
      if (err.name === "AbortError") {
        const e = new Error("Request timed out") as any;
        e.status = 408;
        throw e;
      }
      if (err.status && err.status >= 400 && err.status < 500) {
        throw err;
      }
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 300));
        attempt++;
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retry attempts exceeded');
}

export async function getRequest(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const headers: HeadersInit = options.headers || {};
    const authToken = getToken();
    if (authToken) {
      (headers as Record<string, string>).Authorization = `Bearer ${authToken}`;
    }
    const res = await fetch(baseURL + path, {
      method: "GET",
      headers,
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      let msg = `HTTP error! status: ${res.status}`;
      try {
        const err = await res.json();
        msg = err.message || msg;
      } catch {
        // ignore parse error
      }

      // Tự động đăng xuất nếu Token hết hạn/không hợp lệ (HTTP 401)
      if (res.status === 401 && !path.includes("/api/auth/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        setToken(null);
        window.dispatchEvent(new CustomEvent("auth-change", { detail: { role: "user" } }));
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      }

      throw new Error(msg);
    }
    try {
      return await res.json();
    } catch {
      console.error(`[API] Failed to parse response from ${path}`);
      return {};
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      const e = new Error("Request timed out") as any;
      e.status = 408;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function putRequest<T = any>(url: string, body?: any): Promise<T> {
  return postRequest<T>(url, body, { method: 'PUT' });
}

export async function patchRequest<T = any>(url: string, body?: any): Promise<T> {
  return postRequest<T>(url, body, { method: 'PATCH' });
}

export async function deleteRequest<T = any>(url: string): Promise<T> {
  return postRequest<T>(url, undefined, { method: 'DELETE' });
}
