import { useEffect, useRef, useState } from "react";

/**
 * Hook that returns whether the header should collapse
 * based on scroll position.
 */
export default function useCollapseOnScroll(
  targetEl,
  { threshold = 24, uncollapseDelta = 6 } = {}
) {
  const [collapsed, setCollapsed] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const el = targetEl?.current;
    if (!el) return;

    const getY = () => el.scrollTop;

    function onScroll() {
      const y = getY();
      const dy = y - lastY.current;

      if (!collapsed && y > threshold && dy >= 0) setCollapsed(true);
      else if (collapsed && dy < -uncollapseDelta) setCollapsed(false);

      lastY.current = y;
    }

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [targetEl, threshold, uncollapseDelta, collapsed]);

  return collapsed;
}
