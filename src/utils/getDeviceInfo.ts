/**
 * Detects the user's device name (browser) and operating system based on the user agent string.
 *
 * @returns {{ deviceName: string; deviceOS: string }}
 *   An object containing the detected device name (browser) and operating system.
 *
 * @example
 * const { deviceName, deviceOS } = getDeviceInfo();
 * // deviceName: 'Chrome', deviceOS: 'Windows'
 */
export function getDeviceInfo() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let deviceName = "Unknown Device";
  let deviceOS = "Unknown OS";
  if (/windows/i.test(ua)) deviceOS = "Windows";
  else if (/android/i.test(ua)) deviceOS = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) deviceOS = "iOS";
  else if (/mac os/i.test(ua)) deviceOS = "MacOS";
  else if (/linux/i.test(ua)) deviceOS = "Linux";

  if (/chrome/i.test(ua)) deviceName = "Chrome";
  else if (/firefox/i.test(ua)) deviceName = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) deviceName = "Safari";
  else if (/edg/i.test(ua)) deviceName = "Edge";
  else if (/opera|opr/i.test(ua)) deviceName = "Opera";
  else if (/msie|trident/i.test(ua)) deviceName = "Internet Explorer";

  return { deviceName, deviceOS };
}
