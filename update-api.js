const fs = require('fs');
let file = fs.readFileSync('client/src/lib/api.ts', 'utf8');

if (!file.includes('telemetryApi')) {
  file = file.replace(
    /export const clientTemplatesApi = \{/,
    `export const telemetryApi = {
  getEventLogs: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/event-logs', { params }),
  getMessageLogs: (params?: any) => request<{ success: boolean; data: any[]; pagination: any }>('/api/message-logs', { params }),
  getDashboardMetrics: () => request<{ success: boolean; data: any }>('/api/dashboard/metrics'),
};

export const clientTemplatesApi = {`
  );
  fs.writeFileSync('client/src/lib/api.ts', file, 'utf8');
}
