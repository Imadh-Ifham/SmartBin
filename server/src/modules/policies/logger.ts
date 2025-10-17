enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG"
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private level: LogLevel = LogLevel.DEBUG;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, context?: LogContext): void {
    console.error(`[${LogLevel.ERROR}] ${message}`, context || "");
  }

  warn(message: string, context?: LogContext): void {
    console.warn(`[${LogLevel.WARN}] ${message}`, context || "");
  }

  info(message: string, context?: LogContext): void {
    console.log(`[${LogLevel.INFO}] ${message}`, context || "");
  }

  debug(message: string, context?: LogContext): void {
    if (this.level === LogLevel.DEBUG) {
      console.log(`[${LogLevel.DEBUG}] ${message}`, context || "");
    }
  }
}

export const logger = new Logger();
