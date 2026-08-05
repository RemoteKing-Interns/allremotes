"use client";

import { useEffect } from "react";

const FIELDS = "input, textarea, select";

function disableAutofill(el: Element) {
  if (
    !(el instanceof HTMLInputElement) &&
    !(el instanceof HTMLTextAreaElement) &&
    !(el instanceof HTMLSelectElement)
  ) {
    return;
  }

  // Password fields get "new-password" because browsers ignore "off" for them.
  if (el instanceof HTMLInputElement && el.type === "password") {
    el.setAttribute("autocomplete", "new-password");
  } else {
    el.setAttribute("autocomplete", "off");
  }
}

function applyToNode(node: Node) {
  if (node instanceof Element) {
    if (node.matches?.(FIELDS)) {
      disableAutofill(node);
    }
    node.querySelectorAll?.(FIELDS).forEach(disableAutofill);
  }
}

export default function DisableAutofill() {
  useEffect(() => {
    // Apply to all currently mounted fields
    document.querySelectorAll(FIELDS).forEach(disableAutofill);

    // Watch for any inputs added later (e.g., modals, client-side routing)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          applyToNode(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
