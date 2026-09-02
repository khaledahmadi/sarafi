import {
  Briefcase,
  Coins,
  Globe,
  Landmark,
  MessageCircle,
  Send,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { TranslateFn } from "@/i18n";
import { serviceIcons } from "@/lib/validation";

type ServiceIconName = (typeof serviceIcons)[number];

const SERVICE_ICON_KEYS = {
  send: "icons.send",
  wallet: "icons.wallet",
  coins: "icons.coins",
  globe: "icons.globe",
  briefcase: "icons.briefcase",
  landmark: "icons.landmark",
  "message-circle": "icons.message",
} as const satisfies Record<ServiceIconName, string>;

export const serviceIconMeta: Record<ServiceIconName, { icon: LucideIcon }> = {
  send: { icon: Send },
  wallet: { icon: Wallet },
  coins: { icon: Coins },
  globe: { icon: Globe },
  briefcase: { icon: Briefcase },
  landmark: { icon: Landmark },
  "message-circle": { icon: MessageCircle },
};

export function getServiceIcon(name: string): LucideIcon {
  return serviceIconMeta[name as ServiceIconName]?.icon ?? Send;
}

export function getServiceIconLabel(name: string, t: TranslateFn): string {
  const key = SERVICE_ICON_KEYS[name as ServiceIconName];
  return key ? t(key) : name;
}

export function getServiceIconOptions(t: TranslateFn) {
  return serviceIcons.map((value) => ({
    value,
    label: getServiceIconLabel(value, t),
    icon: serviceIconMeta[value].icon,
  }));
}

/** @deprecated Prefer getServiceIconOptions(t) for localized labels. */
export const serviceIconOptions = serviceIcons.map((value) => ({
  value,
  label: value,
  icon: serviceIconMeta[value].icon,
}));
