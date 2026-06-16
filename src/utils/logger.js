const timestamp = () => new Date().toISOString();

const format = (level, message) => {
  const prefix = `[${timestamp()}] [${level}]`;
  if (message instanceof Error) {
    return `${prefix} ${message.stack || message.message}`;
  }
  return `${prefix} ${message}`;
};

const info = (message) => console.log(format("INFO", message));
const warn = (message) => console.warn(format("WARN", message));
const error = (message) => console.error(format("ERROR", message));
const debug = (message) => console.debug(format("DEBUG", message));

module.exports = {
  info,
  warn,
  error,
  debug,
};
