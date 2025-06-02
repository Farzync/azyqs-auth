import {
  Smartphone,
  Monitor,
  Apple,
  Chrome,
  Globe,
  Globe2,
} from "lucide-react";

export function getDeviceIcon(deviceName?: string, deviceOS?: string) {
  const os = deviceOS?.toLowerCase() || "";
  const browser = deviceName?.toLowerCase() || "";

  if (os.includes("ios") || os.includes("iphone") || os.includes("ipad")) {
    return <Apple className="h-5 w-5" />;
  }
  if (os.includes("android")) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (os.includes("windows") || os.includes("macos") || os.includes("linux")) {
    return <Monitor className="h-5 w-5" />;
  }

  if (browser.includes("chrome")) {
    return <Chrome className="h-5 w-5" />;
  }
  if (browser.includes("firefox")) {
    return <Globe2 className="h-5 w-5" />;
  }

  return <Globe className="h-5 w-5" />;
}
