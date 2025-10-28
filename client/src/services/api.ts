import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import toast from 'react-hot-toast';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: unknown;
  };
}

type RequestMetadata = {
  startTime?: number;
  retryCount?: number;
};

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: RequestMetadata;
  skipAuthRefresh?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

const getAuthToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const persistTokens = (token: string, refreshToken?: string) => {
  localStorage.setItem('token', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

api.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.metadata = {
      ...config.metadata,
      startTime: Date.now(),
      retryCount: config.metadata?.retryCount ?? 0,
    };

    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const metadata = (response.config as ExtendedAxiosRequestConfig).metadata;
    if (import.meta.env.DEV && metadata?.startTime) {
      const duration = Date.now() - metadata.startTime;
      if (duration > 2000) {
        console.warn(`Slow API request (${duration}ms): ${response.config.url}`);
      }
    }

    return response;
  },
  async (error: AxiosError<ApiError | ApiResponse>) => {
    const config = error.config as ExtendedAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    if (
      status === 401 &&
      !config?._retry &&
      !config?.skipAuthRefresh
    ) {
      config._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }

        const refreshResponse = await axios.post<ApiResponse<{ token: string; refreshToken?: string }>>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const payload = refreshResponse.data?.data;
        if (!payload?.token) {
          throw new Error('Unable to refresh session');
        }

        persistTokens(payload.token, payload.refreshToken);
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${payload.token}`;

        return api(config);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    switch (status) {
      case 400:
        toast.error((data as ApiError)?.message || 'Invalid request. Please review the submitted data.');
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('The requested resource was not found.');
        break;
      case 409:
        toast.error('Conflict detected. Please refresh and try again.');
        break;
      case 422: {
        const validationMessage = (data as ApiResponse<{ errors?: Array<{ message?: string }> }>)?.data?.errors
          ?.map(errorItem => errorItem?.message)
          .filter(Boolean)
          .join('\n');
        if (validationMessage) {
          validationMessage.split('\n').forEach(message => toast.error(message));
        } else {
          toast.error((data as ApiError)?.message || 'Validation failed. Please review the highlighted fields.');
        }
        break;
      }
      case 429: {
        const retryAfter = error.response.headers?.['retry-after'];
        toast.error(
          retryAfter
            ? `Too many requests. Try again in ${retryAfter} seconds.`
            : 'Too many requests. Please try again later.'
        );
        break;
      }
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('A server error occurred. Please try again shortly.');
        break;
      default:
        toast.error((data as ApiError)?.message || 'An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

interface RetryOptions {
  retries?: number;
  delay?: number;
  onRetry?: (attempt: number, error: AxiosError) => void;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 2, delay: retryDelay = 500, onRetry } = options;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn(attempt);
    } catch (error) {
      const axiosError = error as AxiosError;
      const shouldRetry =
        attempt < retries &&
        (!axiosError.response || axiosError.response.status >= 500 || axiosError.code === 'ECONNABORTED');

      if (!shouldRetry) {
        throw error;
      }

      attempt += 1;
      onRetry?.(attempt, axiosError);
      await delay(retryDelay * attempt);
    }
  }
}

const request = async <T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  config?: ExtendedAxiosRequestConfig,
  retryOptions?: RetryOptions
): Promise<ApiResponse<T>> => {
  const finalConfig: ExtendedAxiosRequestConfig = {
    ...config,
    signal: config?.signal,
  };

  return withRetry<ApiResponse<T>>(
    () =>
      api
        .request<ApiResponse<T>>({
          method,
          url,
          data,
          ...finalConfig,
        })
        .then(res => res.data),
    retryOptions
  );
};

export const apiClient = {
  get: <T = unknown>(
    url: string,
    config?: ExtendedAxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<ApiResponse<T>> => request<T>('get', url, undefined, config, retryOptions),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: ExtendedAxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<ApiResponse<T>> => request<T>('post', url, data, config, retryOptions),

  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: ExtendedAxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<ApiResponse<T>> => request<T>('put', url, data, config, retryOptions),

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: ExtendedAxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<ApiResponse<T>> => request<T>('patch', url, data, config, retryOptions),

  delete: <T = unknown>(
    url: string,
    config?: ExtendedAxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<ApiResponse<T>> => request<T>('delete', url, undefined, config, retryOptions),

  upload: <T = unknown>(
    url: string,
    formData: FormData,
    config?: ExtendedAxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    request<T>('post', url, formData, {
      ...config,
      headers: {
        ...(config?.headers ?? {}),
        'Content-Type': 'multipart/form-data',
      },
    }),

  download: async (
    url: string,
    config?: ExtendedAxiosRequestConfig
  ): Promise<Blob> => {
    const response = await api.request<Blob>({
      url,
      method: 'get',
      responseType: 'blob',
      ...config,
    });
    return response.data;
  },
};

export default api;
