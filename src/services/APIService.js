import axios from 'axios';
import { configService } from '../services/ConfigService';

export class ApiService {
    #axiosInstance;

    constructor(configService) {
        const baseURL = configService.getValue('VITE_BACKEND_API_BASE_URL');
        this.#axiosInstance = axios.create({
            baseURL: baseURL,
        });
    }

    #handleError(error) {
        if (error.response) {
            // Request berhasil dibuat dan server merespons dengan status error
            console.error('API Error Response:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            // Lempar error baru dengan informasi yang lebih relevan
            throw new Error(`Request Failed with status ${error.response.status}`);
        } else if (error.request) {
            // Request berhasil dibuat tapi tidak ada respons yang diterima
            console.error('API No Response:', error.request);
            throw new Error('No response received from the server.');
        } else {
            // Terjadi error saat setup request
            console.error('API Request Setup Error:', error.message);
            throw new Error(`Error setting up request: ${error.message}`);
        }
    }

    async get(endpoint) {
        try {
            const response = await this.#axiosInstance.get(endpoint);
            return response.data;
        } catch (error) {
            this.#handleError(error);
        }
    }

    async post(endpoint, data) {
        try {
            const response = await this.#axiosInstance.post(endpoint, data);
            return response.data;
        } catch (error) {
            this.#handleError(error);
        }
    }
    
    async put(endpoint, data) {
        try {
            const response = await this.#axiosInstance.put(endpoint, data);
            return response.data;
        } catch (error) {
            this.#handleError(error);
        }
    }

    async delete(endpoint) {
        try {
            const response = await this.#axiosInstance.delete(endpoint);
            return response.data;
        } catch (error) {
            this.#handleError(error);
        }
    }
}

export const apiService = new ApiService(configService);