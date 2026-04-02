const isDev = Boolean(import.meta.env.DEV);

const serialize = (value) => {
  if (value instanceof Error) {
    return {
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
};

const write = (level, message, meta) => {
  if (!isDev && level !== "error") return;

  const payload = meta == null ? "" : serialize(meta);

  if (level === "error") {
    console.error(`[ViaPool] ${message}`, payload);
    return;
  }

  if (level === "warn") {
    console.warn(`[ViaPool] ${message}`, payload);
    return;
  }

  console.info(`[ViaPool] ${message}`, payload);
};

export const logger = {
  error: (message, meta) => write("error", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  info: (message, meta) => write("info", message, meta),
};
