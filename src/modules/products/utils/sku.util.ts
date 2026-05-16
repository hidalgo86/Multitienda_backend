import { randomBytes } from 'crypto';

/**
 * Genera un SKU único para un producto basado en la categoría
 * Formato: CAT-XXXXXX (ejemplo: ROP-8F3K2A)
 *
 * ⚠️ IMPORTANTE:
 * - El SKU se genera UNA SOLA VEZ al crear el producto
 * - Es INMUTABLE y nunca se puede cambiar
 * - Es READ-ONLY para el cliente (solo consulta)
 * - Se usa para reclamos y búsquedas
 *
 * Ventajas:
 * - Prefijo por categoría (ROP=Ropa, JUG=Juguete, ACC=Accesorio, ALI=Alimentación)
 * - 6 caracteres aleatorios → ~3.5 billones de combinaciones
 * - Imposible de predecir (seguridad)
 * - Profesional y legible para clientes
 * - Garantizado único por índice MongoDB
 */
export function generateSku(category: string): string {
  const normalized = String(category).trim().toUpperCase();
  const onlyLetters = normalized.replace(/[^A-Z0-9]/g, '');
  const prefix = (onlyLetters.slice(0, 3) || 'PRD').padEnd(3, 'X');
  const randomId = randomBytes(6)
    .toString('base64url')
    .replace(/[^A-Z0-9]/gi, '')
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, 'X');

  return `${prefix}-${randomId}`;
}
