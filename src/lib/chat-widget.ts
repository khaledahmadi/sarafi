export const OPEN_CHAT_EVENT = "sarafi:open-chat";

export function openSiteChat() {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
}
