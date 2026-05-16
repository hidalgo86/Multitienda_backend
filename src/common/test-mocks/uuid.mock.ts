import { randomUUID } from 'crypto';

export function v4(): string {
  return randomUUID();
}

export function validate(value: string): boolean {
  return typeof value === 'string' && value.length > 0;
}
