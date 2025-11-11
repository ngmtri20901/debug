"use client";

import { useState } from "react";

function openCenteredPopup(url: string, name = "gemini_story", w = 960, h = 720) {
  const topWin = window.top ?? window;
  const y = topWin.outerHeight ? Math.max(0, (topWin.outerHeight - h) / 2) : 0;
  const x = topWin.outerWidth ? Math.max(0, (topWin.outerWidth - w) / 2) : 0;

  // Phải được gọi trong click handler để tránh bị blocker
  const win = window.open(
    url,
    name,
    `popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${w},height=${h},top=${y},left=${x}`
  );
  return win;
}

/** Nút mở Storybook trong popup (fallback sang tab mới nếu bị chặn) */
export default function StorybookPopup({ url, label = "Open Storybook (Popup)" }: { url: string; label?: string }) {
  const [popupBlocked, setPopupBlocked] = useState(false);

  const onClick = () => {
    if (!url) return;
    const win = openCenteredPopup(url);
    // Bị blocker → fallback mở tab mới
    if (!win || win.closed) {
      setPopupBlocked(true);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    }
  };

  return (
    <div className="space-y-1">
      <button
        onClick={onClick}
        className="inline-flex items-center rounded-md px-3 py-2 bg-[#067BC2] text-white hover:bg-[#055a9f] text-sm"
      >
        {label}
      </button>
      {popupBlocked && (
        <p className="text-xs text-muted-foreground">
          Popup bị chặn bởi trình duyệt, đã mở trong tab mới.
        </p>
      )}
    </div>
  );
}
