import axiosInstance from '@/axios/axios-instance'
import { AxiosRequestConfig } from 'axios'

/**
 * Thin typed wrapper around the axios instance that resolves directly to the
 * response body. Use `http.get<T>(...)` etc. in the `*.api.ts` files instead of
 * `axiosInstance.get<T>(...).then(response => response.data)`.
 */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.get<T>(url, config).then(response => response.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.post<T>(url, data, config).then(response => response.data),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.patch<T>(url, data, config).then(response => response.data),
  delete: <T = void>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.delete<T>(url, config).then(response => response.data),
}
