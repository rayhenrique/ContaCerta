type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): LogMessage {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logMessage = this.formatMessage(level, message, data);

    if (this.isDevelopment) {
      switch (level) {
        case 'info':
          console.log(`[INFO] ${logMessage.message}`, data || '');
          break;
        case 'warn':
          console.warn(`[WARN] ${logMessage.message}`, data || '');
          break;
        case 'error':
          console.error(`[ERROR] ${logMessage.message}`, data || '');
          break;
        case 'debug':
          console.debug(`[DEBUG] ${logMessage.message}`, data || '');
          break;
      }
    }

    // Aqui você pode adicionar integração com serviços de monitoramento
    // como Sentry, LogRocket, etc.
  }

  public info(message: string, data?: any) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any) {
    this.log('error', message, data);
  }

  public debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }
}

export const logger = Logger.getInstance();
