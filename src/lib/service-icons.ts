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
import { serviceIcons } from "@/lib/validation";

type ServiceIconName = (typeof serviceIcons)[number];

export const serviceIconMeta: Record<ServiceIconName, { icon: LucideIcon; label: string }> = {
  send: { icon: Send, label: "ارسال" },
  wallet: { icon: Wallet, label: "کیف پول" },
  coins: { icon: Coins, label: "سکه" },
  globe: { icon: Globe, label: "جهان" },
  briefcase: { icon: Briefcase, label: "بازرگانی" },
  landmark: { icon: Landmark, label: "بانک" },
  "message-circle": { icon: MessageCircle, label: "پیام" },
};

export function getServiceIcon(name: string): LucideIcon {
  return serviceIconMeta[name as ServiceIconName]?.icon ?? Send;
}

export function getServiceIconLabel(name: string): string {
  return serviceIconMeta[name as ServiceIconName]?.label ?? name;
}

export const serviceIconOptions = serviceIcons.map((value) => ({
  value,
  label: serviceIconMeta[value].label,
  icon: serviceIconMeta[value].icon,
}));
