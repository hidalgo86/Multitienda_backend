import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

type UnknownError = unknown;

function getErrName(e: UnknownError): string | undefined {
  if (e && typeof e === 'object' && 'name' in e) {
    const n = (e as { name?: unknown }).name;
    return typeof n === 'string' ? n : undefined;
  }
  return undefined;
}

function getErrMessage(e: UnknownError): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    return typeof m === 'string' ? m : JSON.stringify(m);
  }
  return String(e);
}

export function handleServiceError(
  error: UnknownError,
  context: string,
): never {
  const name = getErrName(error);
  if (name === 'CastError') {
    throw new BadRequestException(`Invalid ID in ${context}`);
  }
  if (name === 'ValidationError') {
    throw new BadRequestException(getErrMessage(error));
  }
  if (error instanceof BadRequestException) {
    throw error;
  }
  if (error instanceof NotFoundException) {
    throw error;
  }
  throw new InternalServerErrorException(`${context}: ${getErrMessage(error)}`);
}
