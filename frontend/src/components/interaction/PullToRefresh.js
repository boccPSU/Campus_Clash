import React, { useEffect, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import "./PullToRefresh.scss";

/*
 *  - scrollerRef: ref to the scrollable container (must be the element that scrolls)
 *  - onRefresh?: async () => Promise<void>   // parent-provided refresher
 *  - trigger, maxPull, damping: UI behavior controls
 *  - minDuration?: minimum visual spinner time (ms)
 */
export default function PullToRefresh({
  scrollerRef,
  onRefresh,
  trigger = 64,
  maxPull = 96,
  damping = 0.5,
  minDuration = 450,
  children,
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const draggingRef = useRef(false);

  const canStart = () => {
    const el = scrollerRef?.current;
    return el && el.scrollTop <= 0 && !refreshing;
  };

  const onStart = (y) => {
    if (!canStart()) return;
    draggingRef.current = true;
    startYRef.current = y;
  };

  const onMove = (y) => {
    if (!draggingRef.current) return;
    const dy = y - startYRef.current;
    if (dy <= 0) return setPull(0);
    setPull(Math.min(maxPull, dy * damping));
  };

  const runRefresh = async () => {
    setRefreshing(true);
    setPull(trigger);

    const t0 = Date.now();
    try {
      if (typeof onRefresh === "function") {
        await onRefresh();                 // <-- parent does the data fetching & state updates
      } else {
        console.warn("[PTR] onRefresh not provided, skipping.");
      }
    } catch (err) {
      console.error("[PTR] onRefresh error:", err);
    } finally {
      const elapsed = Date.now() - t0;
      const wait = Math.max(0, minDuration - elapsed);
      setTimeout(() => {
        setRefreshing(false);
        setPull(0);
      }, wait);
    }
  };

  const onEnd = async () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (pull >= trigger) {
      await runRefresh();
    } else {
      setPull(0);
    }
  };

  useEffect(() => {
    const el = scrollerRef?.current;
    if (!el) return;

    const ts = (e) => onStart(e.touches[0].clientY);
    const tm = (e) => {
      if (draggingRef.current) e.preventDefault(); // prevent rubber-band bounce
      onMove(e.touches[0].clientY);
    };
    const te = () => onEnd();

    const md = (e) => onStart(e.clientY);
    const mm = (e) => onMove(e.clientY);
    const mu = () => onEnd();

    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te);

    el.addEventListener("mousedown", md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);

    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
      el.removeEventListener("mousedown", md);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
    };
  }, [scrollerRef, refreshing, trigger, maxPull, damping]);

  return (
    <div style={{ transform: pull ? `translateY(${pull}px)` : undefined }}>
      <div
        className={`ptrIndicator ${refreshing ? "is-refreshing" : ""}`}
        style={{ height: pull ? Math.min(64, pull) : 0, opacity: pull ? 1 : 0 }}
        aria-hidden={!pull && !refreshing}
      >
        {refreshing ? (
          <>
            <Spinner size="sm" animation="border" role="status" />
            <span className="ptrLabel ms-2">Refreshing…</span>
          </>
        ) : (
          <>
            <div className={`ptrArrow ${pull >= trigger ? "up" : ""}`} />
            <span className="ptrLabel ms-2">
              {pull >= trigger ? "Release to refresh" : "Pull to refresh"}
            </span>
          </>
        )}
      </div>
      {children}
    </div>
  );
}
