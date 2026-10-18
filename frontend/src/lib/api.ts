/**
 * Cliente HTTP padronizado usando fetch nativo.
 * Trata erros de API centralizadamente, extraindo a propriedade `message` devolvida pelo backend.
 */

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data?: unknown;

  constructor(status: number, message: string, statusText = '', data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(
  /\/+$/,
  '',
);

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${cleanPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let errorMessage = `Erro HTTP ${res.status}`;
    let errorData: unknown = null;

    if (isJson) {
      try {
        const json = await res.json();
        errorData = json;
        if (typeof json.message === 'string' && json.message.trim().length > 0) {
          errorMessage = json.message;
        } else if (Array.isArray(json.message)) {
          errorMessage = json.message.join('; ');
        }
      } catch {
        // Fallback para mensagem padrão
      }
    } else {
      try {
        const text = await res.text();
        if (text) errorMessage = text;
      } catch {
        // Fallback
      }
    }

    throw new ApiError(res.status, errorMessage, res.statusText, errorData);
  }

  if (isJson) {
    return res.json() as Promise<T>;
  }

  return res.text() as unknown as Promise<T>;
}

export async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = buildUrl(path, params);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    return handleResponse<T>(res);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Falha de conexão com o servidor. Verifique sua rede e tente novamente.');
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = buildUrl(path);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Falha de conexão com o servidor. Verifique sua rede e tente novamente.');
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const url = buildUrl(path);
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Falha de conexão com o servidor. Verifique sua rede e tente novamente.');
  }
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const url = buildUrl(path);
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Falha de conexão com o servidor. Verifique sua rede e tente novamente.');
  }
}

export async function apiDelete(path: string): Promise<void> {
  const url = buildUrl(path);
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });
    return handleResponse<void>(res);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Falha de conexão com o servidor. Verifique sua rede e tente novamente.');
  }
}

export async function apiGetText(path: string, params?: Record<string, unknown>): Promise<string> {
  const url = buildUrl(path, params);
  try {
    const res = await fetch(url, {
      method: 'GET',
    });
    if (!res.ok) {
      let errorMessage = `Erro HTTP ${res.status}`;
      try {
        const json = await res.json();
        if (json.message) errorMessage = json.message;
      } catch {
        // Ignora
      }
      throw new ApiError(res.status, errorMessage);
    }
    return res.text();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Falha de conexão ao baixar o arquivo.');
  }
}
