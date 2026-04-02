/**
 * utils/idempotency.ts
 * Generate SHA-256 idempotency keys for food suggestions.
 * Key = SHA-256(userId|ten_quan|dia_chi|timestamp)
 */

export async function generateIdempotencyKey(
    userId: string,
    tenQuan: string,
    diaChi: string,
    timestamp: string,
): Promise<string> {
    const raw = `${userId}|${tenQuan.trim().toLowerCase()}|${diaChi.trim().toLowerCase()}|${timestamp}`;
    const encoder = new (globalThis as any).TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await (globalThis as any).crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
