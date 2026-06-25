"use client";

import { useEffect } from "react";

const HIDDEN_WIDGET_ATTR = "data-smartcart-hidden-widget";

function findFloatingWidget(element: Element) {
  let current: Element | null = element;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const rect = current.getBoundingClientRect();
    const isFloating = style.position === "fixed" || style.position === "absolute";
    const isRightSide = rect.left > window.innerWidth * 0.55;
    const isWidgetSized = rect.width >= 80 && rect.width <= 190 && rect.height >= 180 && rect.height <= 520;

    if (isFloating && isRightSide && isWidgetSized) {
      return current as HTMLElement;
    }

    current = current.parentElement;
  }

  return null;
}

export function ExternalWidgetHider() {
  useEffect(() => {
    let rafId = 0;
    const hideInjectedWidget = () => {
      const candidates = Array.from(document.body.querySelectorAll("*")).filter((element) => {
        const text = element.textContent?.trim().toLowerCase() || "";
        return text.includes("home") && text.includes("manage");
      });

      for (const candidate of candidates) {
        const widget = findFloatingWidget(candidate);
        if (!widget || widget.hasAttribute(HIDDEN_WIDGET_ATTR)) continue;
        widget.setAttribute(HIDDEN_WIDGET_ATTR, "true");
        widget.style.setProperty("display", "none", "important");
      }
    };

    hideInjectedWidget();
    const observer = new MutationObserver(() => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        hideInjectedWidget();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const stopObserver = window.setTimeout(() => observer.disconnect(), 5000);

    return () => {
      observer.disconnect();
      window.clearTimeout(stopObserver);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
