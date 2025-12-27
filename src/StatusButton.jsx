import { useRef } from 'react';
import { Check, Circle, Clock } from 'lucide-react';

const STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETE: 'complete'
};

export { STATUS };

export default function StatusButton({ status, onTap, onLongPress, size = 'normal', isDark }) {
  const longPressRef = useRef(null);
  const didLongPress = useRef(false);
  const isTouch = useRef(false);
  const LONG_PRESS_DURATION = 500;
  
  const configs = {
    [STATUS.NOT_STARTED]: { icon: Circle, color: '#9ca3af', bg: isDark ? '#374151' : '#f3f4f6' },
    [STATUS.IN_PROGRESS]: { icon: Clock, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7' },
    [STATUS.COMPLETE]: { icon: Check, color: isDark ? '#4ade80' : '#16a34a', bg: isDark ? 'rgba(74,222,128,0.2)' : '#dcfce7' }
  };
  const config = configs[status];
  const Icon = config.icon;
  const sizeClass = size === 'small' ? 'w-6 h-6' : 'w-10 h-10';
  const iconSize = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  
  const startPress = () => {
    didLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress?.();
    }, LONG_PRESS_DURATION);
  };
  
  const endPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (!didLongPress.current) {
      onTap?.();
    }
  };
  
  const cancelPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };
  
  // Touch handlers
  const handleTouchStart = (e) => {
    isTouch.current = true;
    startPress();
  };
  
  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent synthetic click event
    endPress();
  };
  
  // Mouse handlers - only fire if not a touch device
  const handleMouseDown = () => {
    if (isTouch.current) return;
    startPress();
  };
  
  const handleMouseUp = () => {
    if (isTouch.current) return;
    endPress();
  };
  
  const handleMouseLeave = () => {
    if (isTouch.current) return;
    cancelPress();
  };
  
  return (
    <button 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={cancelPress}
      onClick={(e) => e.preventDefault()}
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 select-none touch-manipulation`} 
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon className={iconSize} />
    </button>
  );
}
