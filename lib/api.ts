const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("datacrux_token");
}

export function setToken(token: string) {
  localStorage.setItem("datacrux_token", token);
}

export function clearToken() {
  localStorage.removeItem("datacrux_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(", ") : body.message || message;
    } catch {
      // response wasn't JSON - keep the generic message
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Auth ---
export function login(email: string, password: string) {
  return request<{ accessToken: string; admin: { clientId: string; email: string; role: string } }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
}

// --- Products ---
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: string;
  minPrice: string;
  available: boolean;
  imageUrl: string | null;
  isService: boolean;
  createdAt: string;
}

export function getProducts() {
  return request<Product[]>("/products");
}

export function createProduct(data: {
  name: string;
  description?: string;
  category?: string;
  price: number;
  minPrice: number;
  imageUrl?: string;
  isService?: boolean;
}) {
  return request<Product>("/products", { method: "POST", body: JSON.stringify(data) });
}

export function updateProduct(id: string, data: Partial<{
  name: string;
  description: string;
  category: string;
  price: number;
  minPrice: number;
  available: boolean;
  imageUrl: string;
  isService: boolean;
}>) {
  return request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteProduct(id: string) {
  return request<Product>(`/products/${id}`, { method: "DELETE" });
}

// Uploads an image file to this admin panel's own /api/upload-product-image
// route (which itself verifies the login token against the backend before
// accepting anything), and returns a real hosted URL to save on a product.
export async function uploadProductImage(file: File): Promise<string> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload-product-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // keep generic message
    }
    throw new ApiError(message, res.status);
  }

  const data = await res.json();
  return data.url as string;
}

// --- AI Settings ---
export interface AiSettings {
  tone?: string;
  greeting?: string;
  businessDescription?: string;
  customInstructions?: string;
}

export function getAiSettings() {
  return request<AiSettings>("/clients/ai-settings");
}

export function updateAiSettings(data: AiSettings) {
  return request<AiSettings>("/clients/ai-settings", { method: "PATCH", body: JSON.stringify(data) });
}

// --- Integration / API key ---
export function getApiKey() {
  return request<{ apiKey: string }>("/clients/api-key");
}

export function regenerateApiKey() {
  return request<{ apiKey: string }>("/clients/api-key/regenerate", { method: "POST" });
}

// --- WhatsApp number (for order and handover notifications) ---
export function getWhatsappNumber() {
  return request<{ whatsappNumber: string | null }>("/clients/whatsapp-number");
}

export function updateWhatsappNumber(whatsappNumber: string) {
  return request<{ whatsappNumber: string | null }>("/clients/whatsapp-number", {
    method: "PATCH",
    body: JSON.stringify({ whatsappNumber }),
  });
}
