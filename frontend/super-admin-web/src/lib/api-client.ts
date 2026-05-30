import { jwtDecode } from "jwt-decode";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

interface RequestOptions extends RequestInit {
  token?: string;
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

// Client-side Token Helper
export const authStore = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const isExpired = decoded.exp * 1000 < Date.now();
      if (isExpired) {
        authStore.clearToken();
        return null;
      }
      return token;
    } catch {
      authStore.clearToken();
      return null;
    }
  },
  
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  },
  
  clearToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }
};

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token || authStore.getToken();
  const headers = new Headers(options.headers);
  
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const payload = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new APIError(
      response.status,
      payload.error?.code || "REQUEST_FAILED",
      payload.error?.message || "Something went wrong"
    );
  }
  
  return payload.data;
}
