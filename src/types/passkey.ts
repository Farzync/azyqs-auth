export type Passkey = {
  id: string;
  createdAt: string;
  credentialId: string;
  transports: string[];
  deviceName?: string | null;
  deviceOS?: string | null;
  registeredIp?: string | null;
};
