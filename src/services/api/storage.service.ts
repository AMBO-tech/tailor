import { request } from './apiClient';

export const storageService = {
  async uploadImage(base64Image: string, folder: string = 'fabrics'): Promise<{ url: string }> {
    return request<{ url: string }>('/storage/image', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image, folder }),
    });
  },
};
