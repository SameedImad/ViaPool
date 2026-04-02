const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevelName = String(process.env.LOG_LEVEL || "info").toLowerCase();
const currentLevel = LEVELS[currentLevelName] ?? LEVELS.info;

const shouldLog = (level) => (LEVELS[level] ?? LEVELS.info) <= currentLevel;

const serializeMeta = (meta) => {
  if (meta == null) return "";
  if (meta instanceof Error) {
    return `\n${meta.stack || meta.message}`;
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ` ${String(meta)}`;
  }
};

const write = (level, message, meta) => {
  if (!shouldLog(level)) return;

  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}${serializeMeta(meta)}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
};

export const logger = {
  error: (message, meta) => write("error", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  info: (message, meta) => write("info", message, meta),
  debug: (message, meta) => write("debug", message, meta),
};
