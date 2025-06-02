export interface AuditLogParams {
  userId: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  success: boolean;
  errorMessage?: string;
  at: Date;
}
