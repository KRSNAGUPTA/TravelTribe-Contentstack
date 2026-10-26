// utils/logger.js
const colors = {
  reset: "\x1b[0m",
  dim:   "\x1b[2m",
  red:   "\x1b[31m",
  green: "\x1b[32m",
  yellow:"\x1b[33m",
  blue:  "\x1b[34m",
  magenta:"\x1b[35m",
  cyan:  "\x1b[36m",
  gray:  "\x1b[90m",
};

const isProd = process.env.NODE_ENV === "production";

const timestamp = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

const format = (level, color, label, args) => {
  const ts = `${colors.gray}${timestamp()}${colors.reset}`;

  const [first, ...rest] = args;
  const hasContext = first && typeof first === "object" && !(first instanceof Error);
  const context = hasContext ? first : null;
  const messageParts = hasContext ? rest : args;

  let contextStr = "";
  if (context) {
    const ctxCopy = {};
    for (const [k, v] of Object.entries(context)) {
      if (v instanceof Error) {
        ctxCopy[k] = { message: v.message, stack: v.stack?.split("\n")[0], code: v.code };
      } else {
        ctxCopy[k] = v;
      }
    }
    contextStr = ` ${colors.dim}${JSON.stringify(ctxCopy)}${colors.reset}`;
  }

  const message = messageParts
    .map((p) => {
      if (p instanceof Error) return p.stack || p.message;
      if (typeof p === "object") return JSON.stringify(p);
      return String(p);
    })
    .join(" ");

  return `${ts} ${color}${label}${colors.reset}${contextStr} ${message}`;
};
const logger = {
  info: (...args) =>
    console.log(format("info", colors.cyan, "INFO ", args)),
  warn: (...args) =>
    console.warn(format("warn", colors.yellow, "WARN ", args)),
  error: (...args) =>
    console.error(format("error", colors.red, "ERROR", args)),
  debug: (...args) => {
    if (!isProd) console.debug(format("debug", colors.magenta, "DEBUG", args));
  },
};

export default logger;