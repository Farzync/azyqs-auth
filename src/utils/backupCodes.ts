/**
 * Utilities for MFA/Backup Codes dialog (download & masking)
 * Provides email masking and backup code download helpers.
 */

/**
 * Mask an email address for privacy, e.g. jo****@gm**.c**
 *
 * @param email - The email address to mask
 * @returns The masked email string
 */
export function maskEmail(email: string): string {
  if (!email) return "";
  const [username, domain] = email.split("@");
  const [domainName, extension] = domain.split(".");
  const maskedUsername =
    username.length > 2
      ? username.substring(0, 2) + "*".repeat(Math.max(username.length - 2, 1))
      : username + "*";
  const maskedDomain =
    domainName.length > 2
      ? domainName.substring(0, 2) +
        "*".repeat(Math.max(domainName.length - 2, 1))
      : domainName.substring(0, 1) + "*";
  return `${maskedUsername}@${maskedDomain}.${extension.substring(
    0,
    1
  )}${"*".repeat(Math.max(extension.length - 1, 1))}`;
}

/**
 * Download a set of MFA backup codes as a text file, including user info and instructions.
 *
 * @param params.codes - Array of backup codes to include in the file
 * @param params.user - Optional user info (name, username, email)
 * @param params.filenamePrefix - Optional filename prefix (default: "backup-codes")
 */
export function downloadBackupCodes({
  codes,
  user,
  filenamePrefix = "backup-codes",
}: {
  codes: string[];
  user?: { name?: string; username?: string; email?: string };
  filenamePrefix?: string;
}) {
  const currentDate = new Date().toLocaleDateString("id-ID");
  const currentTime = new Date().toLocaleTimeString("id-ID");
  let content = `${user?.username ?? ""} - Backup Codes\n`;
  content += `Generated on: ${currentDate} at ${currentTime}\n`;
  content += `\n`;
  if (user) {
    content += `Account Information:\n`;
    if (user.name) content += `Name: ${user.name}\n`;
    if (user.username) content += `Username: ${user.username}\n`;
    if (user.email) content += `Email: ${maskEmail(user.email)}\n`;
    content += `\n`;
  }
  content += `IMPORTANT:\n`;
  content += `- Save these codes in a safe place\n`;
  content += `- Each code can only be used once\n`;
  content += `- Use these codes if you lose access to your authenticator app\n`;
  content += `- Do not share these codes with anyone\n`;
  content += `\n`;
  content += `Backup Codes:\n`;
  content += `\n`;
  codes.forEach((code, index) => {
    content += `${index + 1}. ${code}\n`;
  });
  content += `\n`;
  content += `Keep this file secure and delete it once you've saved the codes elsewhere.`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${user?.username?.toLowerCase() ?? filenamePrefix}-${
    new Date().toISOString().split("T")[0]
  }.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
