import toast from 'react-hot-toast';

export async function secureFetch(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Não autorizado. Redirecionando...');
    }

    if (response.status === 403) {
      toast.error('Você não tem permissão para realizar esta ação.');
      throw new Error('Acesso negado.');
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || 'Erro na requisição';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error: any) {
    if (error.message !== 'Acesso negado.' && error.message !== 'Não autorizado. Redirecionando...') {
       console.error('API Error:', error);
    }
    throw error;
  }
}
