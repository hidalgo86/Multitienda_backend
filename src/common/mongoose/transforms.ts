type TransformRecord = Record<string, unknown> & {
  _id?: unknown;
  id?: string;
  __v?: unknown;
};

export const exposeIdAndHideVersion = (_: unknown, ret: unknown): unknown => {
  const record = ret as TransformRecord;

  if (record && typeof record === 'object' && '_id' in record) {
    const id = record._id;
    record.id = typeof id === 'string' ? id : String(id);
    delete record._id;
  }

  delete record.__v;
  return record;
};

export const exposeIdAndOmitFields =
  (fields: string[]) =>
  (_: unknown, ret: unknown): unknown => {
    const record = exposeIdAndHideVersion(_, ret) as Record<string, unknown>;

    fields.forEach((field) => {
      delete record[field];
    });

    return record;
  };
