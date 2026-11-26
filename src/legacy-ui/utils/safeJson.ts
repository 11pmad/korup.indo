export async function parseApiJson<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    if (res.status === 413) {
      throw new Error('Ukuran data atau foto terlalu besar untuk diproses server.');
    }
    throw new Error(
      `Server mengembalikan respons tak terduga (HTTP ${res.status}). Silakan muat ulang halaman (Ctrl+Shift+R) dan coba lagi.`
    );
  }
}
