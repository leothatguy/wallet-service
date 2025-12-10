import { Injectable, LoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger implements LoggerService {
  private context?: string;

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.log(`\x1b[32m[${timestamp}] [LOG] [${ctx}]\x1b[0m ${message}`);
  }

  error(message: string, trace?: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.error(`\x1b[31m[${timestamp}] [ERROR] [${ctx}]\x1b[0m ${message}`);
    if (trace) {
      console.error(`\x1b[31mStack Trace:\x1b[0m\n${trace}`);
    }
  }

  warn(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.warn(`\x1b[33m[${timestamp}] [WARN] [${ctx}]\x1b[0m ${message}`);
  }

  debug(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.debug(`\x1b[36m[${timestamp}] [DEBUG] [${ctx}]\x1b[0m ${message}`);
  }

  verbose(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    console.log(`\x1b[35m[${timestamp}] [VERBOSE] [${ctx}]\x1b[0m ${message}`);
  }
}
