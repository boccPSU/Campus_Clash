import React, { useEffect, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import "./PullToRefresh.scss";

// wraps scrollable screens and adds a pull down to refresh feature to them

//scrollerRef: ref to the scrollable container element
//trigger: px distance to trigger refresh
//maxPull: max visual pull distance
//damping: resistance factor 0-1

export default function PullToRefresh({
  scrollerRef,
  trigger = 64,
  maxPull = 96,
  damping = 0.5,
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

  const onEnd = async () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (pull >= trigger) {
      setRefreshing(true);
      setPull(trigger);
      try {
        // triggers the page reload
        window.location.reload();
      } finally {
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
        }, 450);
      }
    } else {
      setPull(0);
    }
  };

  useEffect(() => {
    const el = scrollerRef?.current;
    if (!el) return;

    const ts = (e) => onStart(e.touches[0].clientY);
    const tm = (e) => {
      if (draggingRef.current) e.preventDefault(); // prevent rubber-band
      onMove(e.touches[0].clientY);
    };

    //allows functionality on touch and w/ mouse
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
  }, [scrollerRef, refreshing]);

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
