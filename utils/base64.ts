/**
 * utils/base64.ts
 * Polyfill for atob/btoa in React Native using base64-js.
 * JWTs use Base64URL, so this implementation includes normalization.
 */
import { toByteArray, fromByteArray } from 'base64-js';

/**
 * Decodes a base64 string to a UTF-8 string.
 * Supports standard Base64 and Base64URL (JWT).
 */
export function atob(base64: string): string {
    // 1. Normalize Base64URL to standard Base64
    let normalized = base64
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    // 2. Add padding if missing
    while (normalized.length % 4 !== 0) {
        normalized += '=';
    }

    // 3. Decode to bytes
    const bytes = toByteArray(normalized);

    // 4. Convert bytes to string (UTF-8 friendly)
    // React Native's Hermes engine supports TextDecoder
    // @ts-ignore
    if (typeof TextDecoder !== 'undefined') {
        // @ts-ignore
        return new TextDecoder().decode(bytes);
    }

    // Fallback for older environments
    return Array.from(bytes)
        .map(b => String.fromCharCode(b))
        .join('');
}

/**
 * Encodes a string to a base64 string.
 */
export function btoa(text: string): string {
    let bytes: Uint8Array;

    // @ts-ignore
    if (typeof TextEncoder !== 'undefined') {
        // @ts-ignore
        bytes = new TextEncoder().encode(text);
    } else {
        bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
            bytes[i] = text.charCodeAt(i);
        }
    }

    return fromByteArray(bytes);
}
