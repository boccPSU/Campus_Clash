import React, { forwardRef } from "react";
import "./ScreenScroll.scss";

/**
 * ScreenScroll
 * ------------
 * Lightweight scrollable wrapper used by screens.
 * Keeps scroll behavior and sizing encapsulated per component.
 */
const ScreenScroll = forwardRef(function ScreenScroll({ className = "", style, children }, ref) {
  return (
    <div ref={ref} className={`screenScroll ${className}`} style={style}>
      {children}
    </div>
  );
});

export default ScreenScroll;
