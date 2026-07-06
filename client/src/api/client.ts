const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request('POST', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request('DELETE', path);
  }
}

export const apiClient = new ApiClient();
