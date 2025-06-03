export enum AuditLogAction {
  REGISTER = "register",
  LOGIN = "login",
  EDIT_PROFILE = "edit_profile",
  CHANGE_PASSWORD = "change_password",
  REGENERATE_BACKUP_CODE = "regenerate_backup_code",
  ENABLE_MFA = "enable_mfa",
  DISABLE_MFA = "disable_mfa",
  GET_MFA_STATUS = "get_mfa_status",
  REGISTER_PASSKEY = "register_passkey",
  UNREGISTER_PASSKEY = "unregister_passkey",
  DELETE_ACCOUNT = "delete_account",
}

export enum AuditLogMethod {
  PASSWORD = "password",
  PASSKEY = "passkey",
  MFA_BACKUP = "mfa_backup",
  MFA = "mfa",
}

export type AuditLogParams = {
  userId: string;
  action: AuditLogAction;
  details?: string;
  ipAddress: string;
  userAgent?: string;
  method?: AuditLogMethod;
  success?: boolean;
  errorMessage?: string;
  at?: Date;
};
