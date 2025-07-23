declare module 'https://unpkg.com/docx-templates/lib/browser.js' {
  interface CreateReportOptions {
    template: Uint8Array;
    data: any;
    noSandbox?: boolean;
    cmdDelimiter?: [string, string];
  }

  export function createReport(options: CreateReportOptions): Promise<ArrayBuffer>;
}
