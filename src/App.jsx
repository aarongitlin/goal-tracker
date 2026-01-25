import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, Circle, Clock, Plus, X, ChevronDown, ChevronRight, Loader2, Settings, Calendar, Tag, MessageSquare, BookOpen, ChevronLeft, GripVertical, Sparkles, ChevronUp, Home, RefreshCw, Pencil, Trash2, MoreVertical } from 'lucide-react';

const STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETE: 'complete'
};

const DEFAULT_TAGS = ['Personal', 'Work'];

const DATE_FILTERS = {
  ALL: 'all',
  TODAY: 'today'
};

const VIEWS = {
  DASHBOARD: 'dashboard',
  MILESTONE: 'milestone'
};

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return "mornin'!";
  if (hour >= 12 && hour < 17) return 'afternoon!';
  if (hour >= 17 && hour < 21) return "evenin'!";
  return 'night owl!';
}

// Framed logo component
function FramedLogo({ color = '#ffffff', size = 24 }) {
  const height = size;
  const width = size * (291 / 336); // maintain aspect ratio
  return (
    <svg width={width} height={height} viewBox="0 0 291 336" fill="none">
      <path d="M0 270.828V0H180.552V49.2414H49.2414V98.4827H164.138V147.724H49.2414V270.828H0Z" fill={color}/>
      <path d="M290.552 65V335.828H110V286.586H241.31V237.345H126.414V188.103H241.31V65H290.552Z" fill={color}/>
    </svg>
  );
}

function formatToday() {
  const today = new Date();
  return today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((taskDate - today) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNoteDateFull(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function getMilestoneStatus(startDate, endDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(startDate); start.setHours(0,0,0,0);
  const end = new Date(endDate); end.setHours(0,0,0,0);
  
  if (today > end) return 'complete';
  if (today < start) return 'upcoming';
  return 'active';
}

function getTimeColors(hour) {
  const h = ((hour % 24) + 24) % 24;

  // REFINED PALETTES: Each time period uses colors from the same hue family
  // for smoother, more seamless gradients (especially for Safari chrome matching)

  // NIGHT (10pm - 5am): Deep indigo family - dark to slightly lighter
  if (h >= 22 || h < 5) {
    return { colors: ['#1a1a2e', '#1e2243', '#252d5c', '#2d3a75'], darkText: false };
  }
  // DAWN (5am - 6:30am): Deep blue to periwinkle
  if (h >= 5 && h < 6.5) {
    return { colors: ['#1e2243', '#2d3a75', '#4555a8', '#6678d1'], darkText: false };
  }
  // SUNRISE (6:30am - 8am): Dusty rose to coral pink
  if (h >= 6.5 && h < 8) {
    return { colors: ['#8b6b72', '#b88088', '#e49aa0', '#ffb5b5'], darkText: false };
  }
  // MORNING (8am - 11am): Warm amber family
  if (h >= 8 && h < 11) {
    return { colors: ['#d4a84b', '#e8be5a', '#f5d26a', '#ffe57a'], darkText: true };
  }
  // MIDDAY (11am - 4pm): Cream to warm white
  if (h >= 11 && h < 16) {
    return { colors: ['#e8dcc4', '#f2e8d4', '#faf4e8', '#fffdf8'], darkText: true };
  }
  // LATE AFTERNOON (4pm - 6pm): Warm orange family
  if (h >= 16 && h < 18) {
    return { colors: ['#c47a4a', '#de8e52', '#f5a35c', '#ffb86c'], darkText: false };
  }
  // SUNSET (6pm - 8pm): Dusty pink to rose
  if (h >= 18 && h < 20) {
    return { colors: ['#8b5a6b', '#a8687d', '#c87d96', '#e895b0'], darkText: false };
  }
  // DUSK (8pm - 10pm): Purple family
  return { colors: ['#4a3a5c', '#5d4a72', '#7a5f96', '#9875ba'], darkText: false };
}

// Helper to create gradient string from colors (for backward compat)
function colorsToGradient(colors) {
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 35%, ${colors[2]} 65%, ${colors[3]} 100%)`;
}

// Helper: interpolate between two hex colors
function interpolateColor(color1, color2, factor) {
  const hex = (c) => parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(3, 5)), b2 = hex(color2.slice(5, 7));

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getTimeGradient(hour) {
  const { colors, darkText } = getTimeColors(hour);
  return { gradient: colorsToGradient(colors), colors, darkText };
}

// Seamless background with smooth linear gradient and subtle center blob
// Designed for Safari chrome matching - colors[0] matches top toolbar, colors[3] matches bottom
function ImmersiveBackground({ colors, darkText }) {
  // Create a mid-color for the subtle blob
  const midColor = interpolateColor(colors[1], colors[2], 0.5);

  return (
    <div className="fixed inset-0" style={{ zIndex: 0 }}>
      {/* Base seamless gradient with interpolated stops for ultra-smooth transition */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${colors[0]} 0%,
            ${colors[0]} 5%,
            ${interpolateColor(colors[0], colors[1], 0.5)} 18%,
            ${colors[1]} 30%,
            ${interpolateColor(colors[1], colors[2], 0.5)} 45%,
            ${colors[2]} 60%,
            ${interpolateColor(colors[2], colors[3], 0.5)} 78%,
            ${colors[3]} 92%,
            ${colors[3]} 100%
          )`
        }}
      />

      {/* Subtle center blob - uses mid-tone color, won't disrupt edge smoothness */}
      <div
        className="absolute"
        style={{
          top: '30%',
          left: '10%',
          width: '80%',
          height: '40%',
          background: `radial-gradient(ellipse at center,
            ${midColor}40 0%,
            ${midColor}20 30%,
            transparent 60%
          )`,
          filter: 'blur(40px)',
        }}
      />

      {/* Very subtle noise for texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: 'overlay'
        }}
      />
    </div>
  );
}

function getMilestoneCompleteGradient() {
  return {
    gradient: `radial-gradient(ellipse at 30% 20%, rgba(74, 222, 128, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%), linear-gradient(135deg, #065f46 0%, #047857 25%, #0d9488 50%, #0891b2 75%, #0284c7 100%)`,
    darkText: false
  };
}

function TagsModal({ isOpen, onClose, allTags, selectedTags, onTagsChange, onRenameTag, onDeleteTag, isDark }) {
  const [editingTag, setEditingTag] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) onTagsChange(selectedTags.filter(t => t !== tag));
    else onTagsChange([...selectedTags, tag]);
  };
  const selectAll = () => onTagsChange([...allTags]);
  const selectNone = () => onTagsChange([]);
  const allSelected = allTags.length > 0 && selectedTags.length === allTags.length;
  const modalBg = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const itemBg = isDark ? '#374151' : '#f3f4f6';
  const inputBg = isDark ? '#1f2937' : '#ffffff';
  const inputBorder = isDark ? '#4b5563' : '#d1d5db';

  const handleStartEdit = (tag, e) => {
    e.stopPropagation();
    setEditingTag(tag);
    setEditValue(tag);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== editingTag) {
      onRenameTag(editingTag, editValue.trim());
    }
    setEditingTag(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditValue('');
  };

  const handleDelete = (tag, e) => {
    e.stopPropagation();
    onDeleteTag(tag);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 pt-12 sm:pt-0" onClick={onClose}>
      <div className="w-full sm:max-w-sm rounded-xl mx-4 sm:mx-0 max-h-[70vh] overflow-hidden" style={{ backgroundColor: modalBg }} onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Filter by Tags</h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ color: textSecondary }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-3 flex gap-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <button onClick={selectAll} className="flex-1 text-sm font-medium py-2 px-3 rounded-lg" style={{ backgroundColor: allSelected ? '#3b82f6' : itemBg, color: allSelected ? 'white' : textSecondary }}>Select All</button>
          <button onClick={selectNone} className="flex-1 text-sm font-medium py-2 px-3 rounded-lg" style={{ backgroundColor: selectedTags.length === 0 ? '#3b82f6' : itemBg, color: selectedTags.length === 0 ? 'white' : textSecondary }}>Clear All</button>
        </div>
        <div className="p-3 overflow-y-auto max-h-[50vh]">
          <div className="space-y-2">
            {allTags.map(tag => (
              <div key={tag} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: selectedTags.includes(tag) ? itemBg : 'transparent' }}>
                <button onClick={() => toggleTag(tag)} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: selectedTags.includes(tag) ? '#3b82f6' : 'transparent', border: selectedTags.includes(tag) ? 'none' : `2px solid ${isDark ? '#4b5563' : '#d1d5db'}` }}>
                    {selectedTags.includes(tag) && <Check className="w-4 h-4 text-white" />}
                  </div>
                  {editingTag === tag ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                      onBlur={handleSaveEdit}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 px-2 py-1 text-base font-medium rounded"
                      style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                      autoFocus
                    />
                  ) : (
                    <span className="text-base font-medium truncate" style={{ color: textPrimary }}>{tag}</span>
                  )}
                </button>
                {editingTag !== tag && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={(e) => handleStartEdit(tag, e)} className="p-2.5 rounded-full hover:bg-black/10" style={{ color: textSecondary, opacity: 0.5 }}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(tag, e)} className="p-2.5 rounded-full hover:bg-red-500/10" style={{ color: '#ef4444', opacity: 0.6 }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {allTags.length === 0 && <p className="text-center py-8" style={{ color: textSecondary }}>No tags yet.</p>}
          </div>
        </div>
        <div className="p-4" style={{ borderTop: `1px solid ${borderColor}` }}>
          <button onClick={onClose} className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium">Done</button>
        </div>
      </div>
    </div>
  );
}

function TagEditor({ selectedTags, onTagsChange, allTags, isDark }) {
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) onTagsChange(selectedTags.filter(t => t !== tag));
    else onTagsChange([...selectedTags, tag]);
  };
  const handleAddNewTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onTagsChange([...selectedTags, trimmed]);
      setNewTagInput('');
      setIsAddingNew(false);
    }
  };
  const availableTags = [...new Set([...DEFAULT_TAGS, ...allTags])];
  const buttonBg = isDark ? '#374151' : '#f3f4f6';
  const buttonText = isDark ? '#d1d5db' : '#374151';
  const inputBg = isDark ? '#1f2937' : '#ffffff';
  const inputBorder = isDark ? '#4b5563' : '#d1d5db';
  
  return (
    <div className="flex flex-wrap gap-2">
      {availableTags.map(tag => (
        <button key={tag} type="button" onClick={() => toggleTag(tag)} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: selectedTags.includes(tag) ? '#3b82f6' : buttonBg, color: selectedTags.includes(tag) ? 'white' : buttonText }}>{tag}</button>
      ))}
      {!isAddingNew ? (
        <button type="button" onClick={() => setIsAddingNew(true)} className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1" style={{ backgroundColor: buttonBg, color: isDark ? '#9ca3af' : '#6b7280' }}><Plus className="w-3 h-3" /> New</button>
      ) : (
        <div className="relative">
          <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewTag(); } if (e.key === 'Escape') { setIsAddingNew(false); setNewTagInput(''); }}} placeholder="Tag name..." className="pl-3 pr-7 py-1.5 text-sm rounded-full w-32" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? '#f3f4f6' : '#111827' }} autoFocus />
          <button type="button" onClick={() => { setIsAddingNew(false); setNewTagInput(''); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/10" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}

// localStorage keys
const LOCAL_STORAGE_KEY = 'framed-milestones';
const LOCAL_VIEW_KEY = 'framed-lastView';
const LOCAL_SUMMARY_PREFIX = 'framed-summary-';

// Old localStorage keys for migration
const OLD_LOCAL_STORAGE_KEY = 'vacation-tracker-milestones';
const OLD_LOCAL_VIEW_KEY = 'vacation-tracker-lastView';
const OLD_LOCAL_SUMMARY_PREFIX = 'vacation-tracker-summary-';

// Migrate localStorage from old keys to new keys
function migrateLocalStorage() {
  // Migrate milestones
  if (!localStorage.getItem(LOCAL_STORAGE_KEY) && localStorage.getItem(OLD_LOCAL_STORAGE_KEY)) {
    const oldData = localStorage.getItem(OLD_LOCAL_STORAGE_KEY);
    localStorage.setItem(LOCAL_STORAGE_KEY, oldData);
    localStorage.removeItem(OLD_LOCAL_STORAGE_KEY);
  }
  
  // Migrate lastView
  if (!localStorage.getItem(LOCAL_VIEW_KEY) && localStorage.getItem(OLD_LOCAL_VIEW_KEY)) {
    const oldView = localStorage.getItem(OLD_LOCAL_VIEW_KEY);
    localStorage.setItem(LOCAL_VIEW_KEY, oldView);
    localStorage.removeItem(OLD_LOCAL_VIEW_KEY);
  }
  
  // Migrate summaries
  const keysToMigrate = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(OLD_LOCAL_SUMMARY_PREFIX)) {
      keysToMigrate.push(key);
    }
  }
  keysToMigrate.forEach(oldKey => {
    const milestoneId = oldKey.replace(OLD_LOCAL_SUMMARY_PREFIX, '');
    const newKey = LOCAL_SUMMARY_PREFIX + milestoneId;
    if (!localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey));
    }
    localStorage.removeItem(oldKey);
  });
}

// Run migration on module load
migrateLocalStorage();

function CircularCountdown({ daysLeft, totalDays, size = 48, darkText = false, isComplete = false }) {
  const progress = totalDays > 0 ? Math.max(0, Math.min(1, 1 - (daysLeft / totalDays))) : 1;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const strokeColor = darkText ? 'rgba(0,0,0,0.8)' : 'white';
  const trackColor = darkText ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-xs" style={{ color: darkText ? 'rgba(0,0,0,0.8)' : 'white' }}>
          {isComplete ? '✓' : daysLeft > 0 ? `${daysLeft}d` : '🎉'}
        </span>
      </div>
    </div>
  );
}

function CircularProgress({ completed, total, size = 40, isDark }) {
  const progress = total > 0 ? completed / total : 0;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={isDark ? '#374151' : '#e5e7eb'} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#3b82f6" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-xs" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}

function GoalSettingsModal({ isOpen, onClose, goal, onSave, onDelete, taskCount = 0, noteCount = 0, isDark }) {
  const [title, setTitle] = useState(goal.title);
  const [startDate, setStartDate] = useState(goal.startDate);
  const [endDate, setEndDate] = useState(goal.endDate);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(goal.title);
      setStartDate(goal.startDate);
      setEndDate(goal.endDate);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, goal]);

  if (!isOpen) return null;

  const modalBg = isDark ? '#1f2937' : '#ffffff';
  const inputBg = isDark ? '#111827' : '#ffffff';
  const inputBorder = isDark ? '#374151' : '#d1d5db';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#374151';

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  // Build delete warning message
  const getDeleteMessage = () => {
    const parts = [];
    if (taskCount > 0) parts.push(`${taskCount} task${taskCount !== 1 ? 's' : ''}`);
    if (noteCount > 0) parts.push(`${noteCount} note${noteCount !== 1 ? 's' : ''}`);
    if (parts.length === 0) return 'Delete this empty milestone?';
    return `Delete milestone, with ${parts.join(' and ')}?`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 pt-12 sm:pt-0" onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-xl mx-4 sm:mx-0" style={{ backgroundColor: modalBg }} onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${inputBorder}` }}>
          <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Milestone Settings</h2>
          <button onClick={onClose} style={{ color: textSecondary }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
          </div>
          <div className="flex flex-row gap-2 overflow-hidden">
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, WebkitAppearance: 'none', maxWidth: '100%', colorScheme: isDark ? 'dark' : 'light' }} />
            </div>
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, WebkitAppearance: 'none', maxWidth: '100%', colorScheme: isDark ? 'dark' : 'light' }} />
            </div>
          </div>

          {/* Bottom action area */}
          {showDeleteConfirm ? (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <p className="text-sm text-center mb-3" style={{ color: '#ef4444' }}>{getDeleteMessage()}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded-lg font-medium text-white"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 rounded-lg"
                style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textSecondary }}
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => { onSave({ title, startDate, endDate }); onClose(); }}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateMilestoneModal({ isOpen, onClose, onCreate, isDark, currentHour }) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setStartDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setEndDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { colors } = getTimeColors(currentHour);
  const accentGradient = `linear-gradient(135deg, ${colors[1]}, ${colors[2]})`;

  const modalBg = isDark ? '#1f2937' : '#ffffff';
  const inputBg = isDark ? '#111827' : '#ffffff';
  const inputBorder = isDark ? '#374151' : '#d1d5db';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#374151';

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      id: Date.now().toString(),
      title: title.trim(),
      startDate,
      endDate,
      tasks: [],
      standaloneNotes: [],
      createdAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 pt-12 sm:pt-0" onClick={onClose}>
      <div className="w-full sm:max-w-md sm:rounded-xl rounded-xl mx-4 sm:mx-0" style={{ backgroundColor: modalBg }} onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${inputBorder}` }}>
          <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>New Milestone</h2>
          <button onClick={onClose} style={{ color: textSecondary }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q1 Goals, Vacation, Sprint 5..." className="w-full px-3 py-2 rounded-lg box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} autoFocus />
          </div>
          <div className="flex flex-row gap-2 overflow-hidden">
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, WebkitAppearance: 'none', maxWidth: '100%', colorScheme: isDark ? 'dark' : 'light' }} />
            </div>
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, WebkitAppearance: 'none', maxWidth: '100%', colorScheme: isDark ? 'dark' : 'light' }} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={!title.trim()} className="w-full py-3 rounded-lg font-medium text-white disabled:opacity-50" style={{ background: accentGradient }}>Create Milestone</button>
        </div>
      </div>
    </div>
  );
}

function StatusButton({ status, onTap, onLongPress, size = 'normal', isDark }) {
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
    longPressRef.current = setTimeout(() => { didLongPress.current = true; onLongPress?.(); }, LONG_PRESS_DURATION);
  };
  const endPress = () => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    if (!didLongPress.current) onTap?.();
  };
  const cancelPress = () => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } };
  const handleTouchStart = () => { isTouch.current = true; startPress(); };
  const handleTouchEnd = (e) => { e.preventDefault(); endPress(); };
  const handleMouseDown = () => { if (isTouch.current) return; startPress(); };
  const handleMouseUp = () => { if (isTouch.current) return; endPress(); };
  const handleMouseLeave = () => { if (isTouch.current) return; cancelPress(); };
  
  return (
    <button onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={cancelPress} onClick={(e) => e.preventDefault()} className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 select-none touch-manipulation`} style={{ backgroundColor: config.bg, color: config.color }}>
      <Icon className={iconSize} />
    </button>
  );
}

function TagBadge({ tag, isDark }) {
  const colors = {
    'Learning': { light: { bg: '#dbeafe', text: '#1d4ed8' }, dark: { bg: 'rgba(59,130,246,0.2)', text: '#93c5fd' }},
    'Health': { light: { bg: '#dcfce7', text: '#16a34a' }, dark: { bg: 'rgba(34,197,94,0.2)', text: '#86efac' }},
    'Projects': { light: { bg: '#f3e8ff', text: '#9333ea' }, dark: { bg: 'rgba(168,85,247,0.2)', text: '#d8b4fe' }},
    'Work': { light: { bg: '#ffedd5', text: '#ea580c' }, dark: { bg: 'rgba(249,115,22,0.2)', text: '#fdba74' }},
    'Personal': { light: { bg: '#fce7f3', text: '#db2777' }, dark: { bg: 'rgba(236,72,153,0.2)', text: '#f9a8d4' }},
    'Planning': { light: { bg: '#cffafe', text: '#0891b2' }, dark: { bg: 'rgba(6,182,212,0.2)', text: '#67e8f9' }}
  };
  const scheme = colors[tag] || { light: { bg: '#f3f4f6', text: '#374151' }, dark: { bg: '#374151', text: '#d1d5db' }};
  const c = isDark ? scheme.dark : scheme.light;
  return <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: c.bg, color: c.text }}>{tag}</span>;
}

function DateBadge({ dueDate, isDark }) {
  if (!dueDate) return null;
  const taskToday = isToday(dueDate);
  let bg, text;
  if (taskToday) { bg = isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe'; text = isDark ? '#93c5fd' : '#2563eb'; }
  else { bg = isDark ? '#374151' : '#f3f4f6'; text = isDark ? '#9ca3af' : '#6b7280'; }
  return <span className="px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1" style={{ backgroundColor: bg, color: text }}><Calendar className="w-3 h-3" />{formatDateShort(dueDate)}</span>;
}

function MilestoneSummary({ tasks, standaloneNotes, goal, isDark, savedSummary, onSaveSummary }) {
  const [summary, setSummary] = useState(savedSummary || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!!savedSummary);
  const [error, setError] = useState(null);
  
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  
  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, standaloneNotes, goal })
      });
      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
        onSaveSummary(data.summary);
        setIsExpanded(true);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Unable to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
      <button onClick={() => summary ? setIsExpanded(!isExpanded) : generateSummary()} className="w-full p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold" style={{ color: textPrimary }}>AI Reflection</h3>
            <p className="text-sm" style={{ color: textSecondary }}>{summary ? 'Your milestone summary' : 'Generate a summary of your journey'}</p>
          </div>
        </div>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: textSecondary }} /> : summary ? (isExpanded ? <ChevronUp className="w-5 h-5" style={{ color: textSecondary }} /> : <ChevronDown className="w-5 h-5" style={{ color: textSecondary }} />) : <ChevronRight className="w-5 h-5" style={{ color: textSecondary }} />}
      </button>
      {isExpanded && summary && (
        <div className="px-4 pb-4">
          <div className="p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb', color: textPrimary }}>{summary}</div>
          <button onClick={generateSummary} disabled={isLoading} className="mt-3 text-sm font-medium flex items-center gap-1" style={{ color: '#3b82f6' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />Regenerate
          </button>
        </div>
      )}
      {error && <div className="px-4 pb-4"><p className="text-sm text-red-500">{error}</p></div>}
    </div>
  );
}

function NotesModal({ isOpen, onClose, task, onUpdateTask, isDark }) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteDate, setNewNoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState('');
  
  if (!isOpen || !task) return null;
  
  const modalBg = isDark ? '#1f2937' : '#ffffff';
  const inputBg = isDark ? '#111827' : '#f9fafb';
  const inputBorder = isDark ? '#374151' : '#d1d5db';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const noteBg = isDark ? '#374151' : '#f3f4f6';
  
  const notes = task.notes || [];
  const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    const newNote = { id: Date.now().toString(), content: newNoteContent.trim(), date: newNoteDate, createdAt: new Date().toISOString() };
    onUpdateTask({ ...task, notes: [...notes, newNote] });
    setNewNoteContent('');
    setNewNoteDate(new Date().toISOString().split('T')[0]);
  };
  const handleDeleteNote = (noteId) => { onUpdateTask({ ...task, notes: notes.filter(n => n.id !== noteId) }); };
  const handleStartEdit = (note) => { setEditingNoteId(note.id); setEditContent(note.content); setEditDate(note.date); };
  const handleSaveEdit = () => { onUpdateTask({ ...task, notes: notes.map(n => n.id === editingNoteId ? { ...n, content: editContent, date: editDate } : n) }); setEditingNoteId(null); };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 pt-12 sm:pt-0" onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-xl mx-4 sm:mx-0 max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: modalBg }} onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center flex-shrink-0" style={{ borderBottom: `1px solid ${inputBorder}` }}>
          <div><h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Notes</h2><p className="text-sm" style={{ color: textSecondary }}>{task.title}</p></div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ color: textSecondary }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${inputBorder}` }}>
          <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Add a note..." rows={2} className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: textSecondary }} /><input type="date" value={newNoteDate} onChange={(e) => setNewNoteDate(e.target.value)} className="text-sm px-2 py-1 rounded" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, colorScheme: isDark ? 'dark' : 'light' }} /></div>
            <button onClick={handleAddNote} disabled={!newNoteContent.trim()} className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">Add Note</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedNotes.length === 0 ? <p className="text-center py-8" style={{ color: textSecondary }}>No notes yet</p> : sortedNotes.map(note => (
            <div key={note.id} className="p-3 rounded-lg" style={{ backgroundColor: noteBg }}>
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} className="w-full px-2 py-1 rounded text-sm resize-none" style={{ backgroundColor: inputBg, border: `1px solid #3b82f6`, color: textPrimary }} autoFocus />
                  <div className="flex items-center justify-between">
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="text-sm px-2 py-1 rounded" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, colorScheme: isDark ? 'dark' : 'light' }} />
                    <div className="flex gap-2"><button onClick={() => setEditingNoteId(null)} className="text-sm" style={{ color: textSecondary }}>Cancel</button><button onClick={handleSaveEdit} className="text-sm text-blue-500 font-medium">Save</button></div>
                  </div>
                </div>
              ) : (
                <><p className="text-sm" style={{ color: textPrimary }}>{note.content}</p><div className="flex items-center justify-between mt-2"><span className="text-xs" style={{ color: textSecondary }}>{formatNoteDateFull(note.date)}</span><div className="flex gap-3"><button onClick={() => handleStartEdit(note)} className="text-xs" style={{ color: textSecondary }}>Edit</button><button onClick={() => handleDeleteNote(note.id)} className="text-xs text-red-500">Delete</button></div></div></>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JournalView({ tasks, standaloneNotes, onUpdateTask, onUpdateStandaloneNotes, onClose, onOpenAddModal, isDark, goal }) {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState('');
  
  const bgColor = isDark ? '#111827' : '#f9fafb';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const inputBg = isDark ? '#111827' : '#f9fafb';
  const inputBorder = isDark ? '#374151' : '#d1d5db';
  
  const taskNotes = tasks.flatMap(task => (task.notes || []).map(note => ({ ...note, type: 'task', taskId: task.id, taskTitle: task.title, taskTags: task.tags })));
  const standaloneWithType = standaloneNotes.map(note => ({ ...note, type: 'standalone' }));
  const allNotes = [...taskNotes, ...standaloneWithType];
  const sortedNotes = allNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
  const groupedByDate = sortedNotes.reduce((acc, note) => { const dateKey = note.date; if (!acc[dateKey]) acc[dateKey] = []; acc[dateKey].push(note); return acc; }, {});
  const dateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
  
  const handleStartEdit = (note) => { setEditingNoteId(note.id); setEditContent(note.content); setEditDate(note.date); };
  const handleSaveEdit = (note) => {
    if (note.type === 'standalone') { onUpdateStandaloneNotes(standaloneNotes.map(n => n.id === note.id ? { ...n, content: editContent, date: editDate } : n)); }
    else { const task = tasks.find(t => t.id === note.taskId); if (task) onUpdateTask({ ...task, notes: task.notes.map(n => n.id === note.id ? { ...n, content: editContent, date: editDate } : n) }); }
    setEditingNoteId(null);
  };
  const handleDeleteNote = (note) => {
    if (note.type === 'standalone') { onUpdateStandaloneNotes(standaloneNotes.filter(n => n.id !== note.id)); }
    else { const task = tasks.find(t => t.id === note.taskId); if (task) onUpdateTask({ ...task, notes: task.notes.filter(n => n.id !== note.id) }); }
  };
  
  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ backgroundColor: bgColor }}>
      <div className="sticky top-0 z-10 px-4 pb-4 flex items-center gap-3" style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}`, paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <button onClick={onClose} className="p-2 -ml-2 rounded-full" style={{ color: textSecondary }}><ChevronLeft className="w-5 h-5" /></button>
        <div><h1 className="text-xl font-bold" style={{ color: textPrimary }}>Journal</h1><p className="text-sm" style={{ color: textSecondary }}>{goal.title}</p></div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {dateKeys.length === 0 ? (
          <div className="text-center py-16"><BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: textSecondary }} /><p className="text-lg font-medium" style={{ color: textPrimary }}>No notes yet</p><p className="text-sm mt-1" style={{ color: textSecondary }}>Tap + to add your first note</p></div>
        ) : (
          <div className="space-y-6">
            {dateKeys.map(dateKey => (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-3"><div className="w-2 h-2 rounded-full bg-blue-500" /><h2 className="text-sm font-semibold" style={{ color: textPrimary }}>{formatNoteDateFull(dateKey)}</h2></div>
                <div className="ml-4 pl-4 space-y-3" style={{ borderLeft: `2px solid ${borderColor}` }}>
                  {groupedByDate[dateKey].map(note => (
                    <div key={note.id} className="p-3 rounded-lg" style={{ backgroundColor: cardBg }}>
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} className="w-full px-2 py-1 rounded text-sm resize-none" style={{ backgroundColor: inputBg, border: `1px solid #3b82f6`, color: textPrimary }} autoFocus />
                          <div className="flex items-center justify-between">
                            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="text-sm px-2 py-1 rounded" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, colorScheme: isDark ? 'dark' : 'light' }} />
                            <div className="flex gap-2"><button onClick={() => setEditingNoteId(null)} className="text-sm" style={{ color: textSecondary }}>Cancel</button><button onClick={() => handleSaveEdit(note)} className="text-sm text-blue-500 font-medium">Save</button></div>
                          </div>
                        </div>
                      ) : (
                        <><p className="text-sm" style={{ color: textPrimary }}>{note.content}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {note.type === 'task' ? (<><span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb', color: textSecondary }}>{note.taskTitle}</span>{note.taskTags.slice(0, 2).map(tag => <TagBadge key={tag} tag={tag} isDark={isDark} />)}</>) : (<span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe', color: isDark ? '#93c5fd' : '#2563eb' }}>Journal Entry</span>)}
                            <span className="flex-1" /><button onClick={() => handleStartEdit(note)} className="text-xs" style={{ color: textSecondary }}>Edit</button><button onClick={() => handleDeleteNote(note)} className="text-xs text-red-500">Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onOpenAddModal} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center z-50" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}><Plus className="w-6 h-6" /></button>
    </div>
  );
}

function DragHandle({ isDark, onDragStart, isDragging }) {
  const longPressRef = useRef(null);
  const didLongPress = useRef(false);
  const isTouch = useRef(false);
  const isPressing = useRef(false);
  const handleRef = useRef(null);
  const LONG_PRESS_DURATION = 150; // Reduced for faster response on desktop
  const textMuted = isDark ? '#6b7280' : '#9ca3af';
  
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const preventScroll = (e) => { if (isPressing.current) e.preventDefault(); };
    handle.addEventListener('touchmove', preventScroll, { passive: false });
    return () => { handle.removeEventListener('touchmove', preventScroll); };
  }, []);
  
  const startPress = (e) => {
    isPressing.current = true;
    didLongPress.current = false;
    const event = e; // Capture the event
    longPressRef.current = setTimeout(() => {
      didLongPress.current = true;
      onDragStart?.(event);
    }, LONG_PRESS_DURATION);
  };
  const endPress = () => { isPressing.current = false; if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } };
  const cancelPress = () => { isPressing.current = false; if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } };
  const handleTouchStart = (e) => { isTouch.current = true; startPress(e); };
  const handleTouchEnd = (e) => { e.preventDefault(); endPress(); };
  const handleMouseDown = (e) => { if (isTouch.current) return; startPress(e); };
  const handleMouseUp = () => { if (isTouch.current) return; endPress(); };
  const handleMouseLeave = () => { if (isTouch.current) return; cancelPress(); };
  
  return (
    <div ref={handleRef} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={cancelPress} className="p-2 cursor-grab active:cursor-grabbing select-none" style={{ color: isDragging ? '#3b82f6' : textMuted, touchAction: 'none' }}>
      <GripVertical className="w-5 h-5" />
    </div>
  );
}

function TaskItem({ task, onUpdate, onDelete, allTags, isDark, onOpenNotes, onDragStart, isDragging, isMilestoneComplete, isEditing, onSetEditing }) {
  const [expanded, setExpanded] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [dueDateValue, setDueDateValue] = useState(task.dueDate || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef(null);
  const wasDraggingRef = useRef(false);

  const editing = isEditing;
  const setEditing = (val) => { if (!val) setShowDatePicker(false); onSetEditing(val ? task.id : null); };

  // Track when dragging ends to prevent click from opening edit mode
  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
    } else if (wasDraggingRef.current) {
      // Keep the flag true briefly after drag ends to block the click
      const timer = setTimeout(() => {
        wasDraggingRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  const handleTap = (currentStatus) => currentStatus === STATUS.COMPLETE ? STATUS.NOT_STARTED : STATUS.COMPLETE;
  const handleLongPress = (currentStatus) => currentStatus === STATUS.IN_PROGRESS ? STATUS.NOT_STARTED : STATUS.IN_PROGRESS;
  const handleSave = () => { if (titleValue.trim()) onUpdate({ ...task, title: titleValue.trim(), dueDate: dueDateValue || null }); setEditing(false); };
  const handleAddSubtask = () => { if (newSubtask.trim()) { onUpdate({ ...task, subtasks: [...task.subtasks, { id: `${task.id}-${Date.now()}`, title: newSubtask.trim(), status: STATUS.NOT_STARTED }] }); setNewSubtask(''); } };
  const handleCardClick = (e) => { if (editing || isDragging || wasDraggingRef.current) return; if (e.target.closest('button') || e.target.closest('input') || e.target.closest('[data-drag-handle]')) return; setTitleValue(task.title); setDueDateValue(task.dueDate || ''); setEditing(true); };

  const completedSubtasks = task.subtasks.filter(st => st.status === STATUS.COMPLETE).length;
  const hasSubtasks = task.subtasks.length > 0;
  const noteCount = (task.notes || []).length;

  // Semi-transparent card with glass effect
  const cardBg = isDark ? 'rgba(31, 41, 55, 0.4)' : 'rgba(255, 255, 255, 0.25)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const textMuted = isDark ? '#6b7280' : '#9ca3af';
  const subtaskBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)';
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.9)';

  // Enhanced drag style - item lifts and becomes more prominent
  const dragStyle = isDragging ? {
    transform: 'scale(1.02)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.25), 0 8px 10px rgba(0,0,0,0.15)',
  } : {};

  const isComplete = task.status === STATUS.COMPLETE;

  return (
    <div className="relative rounded-xl shadow-sm overflow-hidden transition-all backdrop-blur-md" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, ...dragStyle }}>
      {/* Add note button - outside opacity wrapper for completed tasks */}
      {!editing && isComplete && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenNotes(task); }}
          className="absolute right-12 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full shadow-sm"
          style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#d1d5db' : '#6b7280' }}
        >
          <BookOpen className="w-4 h-4" />
        </button>
      )}
      <div className={isComplete ? 'opacity-50' : ''}>
        <div className="px-3 py-2.5" onClick={handleCardClick}>
          <div className="flex items-center gap-3">
          <StatusButton status={task.status} onTap={() => onUpdate({ ...task, status: handleTap(task.status) })} onLongPress={() => onUpdate({ ...task, status: handleLongPress(task.status) })} isDark={isDark} />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3" onClick={e => e.stopPropagation()}>
                {/* Top row - Delete on left, Done on right */}
                <div className="flex items-center justify-between min-h-[44px] sm:min-h-[32px] -mt-1">
                  <button onClick={() => onDelete(task.id)} className="text-xs text-red-500 px-2 py-1">Delete</button>
                  <button onClick={handleSave} className="text-sm text-blue-500 font-medium px-3 py-2 sm:py-1 rounded-lg active:bg-blue-500/10">Done</button>
                </div>
                {/* Title input - taller on mobile */}
                <textarea
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } if (e.key === 'Escape') setEditing(false); }}
                  className="w-full text-sm font-medium px-3 py-2 rounded-lg resize-none min-h-[60px] sm:min-h-[38px]"
                  style={{ backgroundColor: inputBg, border: '1px solid #3b82f6', color: textPrimary }}
                  rows={1}
                  autoFocus
                />
                {/* Action buttons row - Note and Deadline */}
                <div className="flex items-center gap-2">
                  {/* Note button */}
                  <button
                    onClick={() => onOpenNotes(task)}
                    className="flex items-center gap-1.5 text-sm py-1.5 sm:py-1 px-2 rounded-lg"
                    style={{ color: textSecondary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: noteCount > 0 ? '#3b82f6' : (isDark ? '#374151' : '#d1d5db'), color: noteCount > 0 ? 'white' : textMuted }}>
                      <BookOpen className="w-3 h-3" />
                    </span>
                    <span className="text-xs">{noteCount > 0 ? noteCount : 'Note'}</span>
                  </button>
                  {/* Deadline button / picker */}
                  {!isMilestoneComplete && (
                    showDatePicker ? (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                        <input
                          ref={dateInputRef}
                          type="date"
                          value={dueDateValue}
                          onChange={(e) => { setDueDateValue(e.target.value); setShowDatePicker(false); }}
                          onBlur={() => setShowDatePicker(false)}
                          className="text-xs bg-transparent border-none focus:outline-none"
                          style={{ color: textPrimary, colorScheme: isDark ? 'dark' : 'light' }}
                          autoFocus
                        />
                        {dueDateValue && <button onClick={() => { setDueDateValue(''); setShowDatePicker(false); }} className="p-0.5" style={{ color: textMuted }}><X className="w-3 h-3" /></button>}
                      </div>
                    ) : (
                      <button
                        onClick={() => { setShowDatePicker(true); setTimeout(() => dateInputRef.current?.showPicker?.(), 50); }}
                        className="flex items-center gap-1.5 text-sm py-1.5 sm:py-1 px-2 rounded-lg"
                        style={{ color: textSecondary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: dueDateValue ? '#3b82f6' : (isDark ? '#374151' : '#d1d5db'), color: dueDateValue ? 'white' : textMuted }}>
                          <Calendar className="w-3 h-3" />
                        </span>
                        <span className="text-xs">{dueDateValue ? new Date(dueDateValue + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Deadline'}</span>
                      </button>
                    )
                  )}
                </div>
                <TagEditor selectedTags={task.tags} onTagsChange={(tags) => onUpdate({ ...task, tags })} allTags={allTags} isDark={isDark} />
              </div>
            ) : (
              <><p className={`text-sm font-medium leading-snug ${task.status === STATUS.COMPLETE ? 'line-through' : ''}`} style={{ color: task.status === STATUS.COMPLETE ? textSecondary : textPrimary }}>{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {!isMilestoneComplete && <DateBadge dueDate={task.dueDate} isDark={isDark} />}
                  {task.tags.map(tag => <TagBadge key={tag} tag={tag} isDark={isDark} />)}
                  {noteCount > 0 && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(task); }} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe', color: isDark ? '#93c5fd' : '#2563eb' }}><BookOpen className="w-3 h-3" />{noteCount}</button>}
                  {hasSubtasks && <><span className="text-xs" style={{ color: textMuted }}>·</span><button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-xs flex items-center gap-0.5" style={{ color: textSecondary }}>{expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}{completedSubtasks}/{task.subtasks.length}</button></>}
                </div>
              </>
            )}
          </div>
          {!editing && <div data-drag-handle onClick={e => e.stopPropagation()}><DragHandle isDark={isDark} onDragStart={(e) => onDragStart(task.id, e)} isDragging={isDragging} /></div>}
        </div>
      </div>
      {((expanded && hasSubtasks) || editing) && (
        <div className="px-3 py-2" style={{ backgroundColor: subtaskBg, borderTop: `1px solid ${cardBorder}` }}>
          {task.subtasks.map(st => (
            <div key={st.id} className="flex items-center gap-3 py-1.5">
              <StatusButton status={st.status} onTap={() => onUpdate({ ...task, subtasks: task.subtasks.map(s => s.id === st.id ? { ...s, status: handleTap(s.status) } : s) })} onLongPress={() => onUpdate({ ...task, subtasks: task.subtasks.map(s => s.id === st.id ? { ...s, status: handleLongPress(s.status) } : s) })} size="small" isDark={isDark} />
              <span className={`text-sm ${st.status === STATUS.COMPLETE ? 'line-through' : ''}`} style={{ color: st.status === STATUS.COMPLETE ? textMuted : textSecondary }}>{st.title}</span>
            </div>
          ))}
          {editing && (
            <div className={`flex items-center gap-2 ${hasSubtasks ? 'pt-2 mt-2' : ''}`} style={{ borderTop: hasSubtasks ? `1px solid ${cardBorder}` : 'none' }}>
              <button type="button" onClick={handleAddSubtask} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: newSubtask.trim() ? '#3b82f6' : (isDark ? '#374151' : '#e5e7eb'), color: newSubtask.trim() ? 'white' : textMuted }}><Plus className="w-4 h-4" /></button>
              <input id={`subtask-input-${task.id}`} type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newSubtask.trim()) handleAddSubtask(); }} placeholder="Add subtask..." className="flex-1 text-sm bg-transparent focus:outline-none" style={{ color: textPrimary }} />
            </div>
          )}
        </div>
      )}
      </div>{/* closes opacity wrapper */}
    </div>
  );
}

function AddModal({ isOpen, onClose, defaultTab, onAddTask, onAddNote, allTags, isDark, currentHour }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => { if (isOpen) { setActiveTab(defaultTab); setTitle(''); setSelectedTags([]); setDueDate(''); setShowDatePicker(false); setNoteContent(''); setNoteDate(new Date().toISOString().split('T')[0]); } }, [isOpen, defaultTab]);

  const handleSubmitTask = (e) => { e.preventDefault(); if (!title.trim()) return; onAddTask({ id: Date.now().toString(), title: title.trim(), status: STATUS.NOT_STARTED, tags: selectedTags, dueDate: dueDate || null, subtasks: [], notes: [] }); onClose(); };
  const handleSubmitNote = (e) => { e.preventDefault(); if (!noteContent.trim()) return; onAddNote({ id: Date.now().toString(), content: noteContent.trim(), date: noteDate, createdAt: new Date().toISOString() }); onClose(); };

  if (!isOpen) return null;

  // Get time-based colors for gradient accent
  const { colors } = getTimeColors(currentHour);
  const accentGradient = `linear-gradient(135deg, ${colors[1]}, ${colors[2]})`;

  // Darker modal with slight transparency
  const modalBg = 'rgba(17, 24, 39, 0.98)';
  const inputBg = 'rgba(31, 41, 55, 0.8)';
  const inputBorder = 'rgba(75, 85, 99, 0.6)';
  const textPrimary = '#f3f4f6';
  const textSecondary = '#9ca3af';
  const toggleBg = 'rgba(55, 65, 81, 0.6)';

  // Calculate header height for content padding
  const headerHeight = 'calc(56px + env(safe-area-inset-top, 0px))';

  // Use portal to render modal at document root, escaping any parent overflow constraints
  return createPortal(
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {/* Modal background - covers entire screen */}
      <div className="absolute inset-0" style={{ backgroundColor: modalBg }} />

      {/* Fixed header - stays at top when scrolling */}
      <div
        className="fixed top-0 left-0 right-0 z-[61] px-4 flex justify-between items-center"
        style={{
          backgroundColor: modalBg,
          borderBottom: `1px solid ${inputBorder}`,
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          paddingBottom: '12px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Add New</h2>
        <div className="flex items-center gap-3">
          {/* Compact Task/Note toggle */}
          <div className="flex rounded-full p-0.5" style={{ backgroundColor: toggleBg }}>
            <button
              onClick={() => setActiveTab('task')}
              className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors"
              style={{ background: activeTab === 'task' ? accentGradient : 'transparent', color: activeTab === 'task' ? 'white' : textSecondary }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Task</span>
            </button>
            <button
              onClick={() => setActiveTab('note')}
              className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors"
              style={{ background: activeTab === 'note' ? accentGradient : 'transparent', color: activeTab === 'note' ? 'white' : textSecondary }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Note</span>
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: textSecondary }}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        className="absolute inset-0 overflow-y-auto"
        style={{ paddingTop: headerHeight }}
        onClick={e => e.stopPropagation()}
      >
        {activeTab === 'task' && (
          <form onSubmit={handleSubmitTask} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Task Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} placeholder="What do you want to accomplish?" autoFocus />
            </div>
            <div className="flex items-center gap-3">
              {/* Deadline button / picker */}
              {showDatePicker ? (
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg" style={{ backgroundColor: inputBg }}>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={dueDate}
                    onChange={(e) => { setDueDate(e.target.value); setShowDatePicker(false); }}
                    onBlur={() => setShowDatePicker(false)}
                    className="text-sm bg-transparent border-none focus:outline-none"
                    style={{ color: textPrimary, colorScheme: isDark ? 'dark' : 'light' }}
                    autoFocus
                  />
                  {dueDate && (
                    <button type="button" onClick={() => { setDueDate(''); setShowDatePicker(false); }} className="p-0.5" style={{ color: textSecondary }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowDatePicker(true); setTimeout(() => dateInputRef.current?.showPicker?.(), 50); }}
                  className="flex items-center gap-2 text-sm py-2 px-3 rounded-lg"
                  style={{ color: textSecondary, backgroundColor: inputBg }}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: dueDate ? '#3b82f6' : '#374151', color: dueDate ? 'white' : textSecondary }}>
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <span>{dueDate ? new Date(dueDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Deadline'}</span>
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textSecondary }}>Tags</label>
              <TagEditor selectedTags={selectedTags} onTagsChange={setSelectedTags} allTags={allTags} isDark={isDark} />
            </div>
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
              <button type="submit" className="w-full py-3 rounded-lg font-medium text-white" style={{ background: accentGradient }}>Add Task</button>
            </div>
          </form>
        )}
        {activeTab === 'note' && (
          <form onSubmit={handleSubmitNote} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Note</label>
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="What's on your mind?" rows={4} className="w-full px-3 py-2 rounded-lg resize-none box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Date</label>
              <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} className="w-full px-3 py-2 rounded-lg box-border" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, WebkitAppearance: 'none', colorScheme: isDark ? 'dark' : 'light' }} />
            </div>
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
              <button type="submit" className="w-full py-3 rounded-lg font-medium text-white" style={{ background: accentGradient }}>Add Note</button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

// Dashboard Component
function Dashboard({ milestones, onSelectMilestone, onCreateMilestone, onUpdateMilestone, onDeleteMilestone, isDark, currentHour }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [settingsMilestone, setSettingsMilestone] = useState(null);

  const { colors, darkText } = getTimeColors(currentHour);
  const greeting = getGreeting(Math.floor(currentHour));

  // Text colors that work on the gradient - high contrast for legibility
  const textPrimary = darkText ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,1)';
  const textSecondary = darkText ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
  const textMuted = darkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';

  // Glass card styling - more opaque for better contrast
  const cardBg = darkText ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)';
  const cardBorder = darkText ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)';
  const cardHover = darkText ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.24)';
  const glowColor = darkText ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)';

  // Sort milestones: active first, then upcoming, then complete (newest first)
  const sortedMilestones = [...milestones].sort((a, b) => {
    const statusA = getMilestoneStatus(a.startDate, a.endDate);
    const statusB = getMilestoneStatus(b.startDate, b.endDate);
    const order = { active: 0, upcoming: 1, complete: 2 };
    if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const activeMilestones = sortedMilestones.filter(m => getMilestoneStatus(m.startDate, m.endDate) === 'active');
  const upcomingMilestones = sortedMilestones.filter(m => getMilestoneStatus(m.startDate, m.endDate) === 'upcoming');
  const completeMilestones = sortedMilestones.filter(m => getMilestoneStatus(m.startDate, m.endDate) === 'complete');

  // Single milestone row (used inside grouped cards)
  const MilestoneRow = ({ milestone, showDivider }) => {
    const status = getMilestoneStatus(milestone.startDate, milestone.endDate);
    const tasks = milestone.tasks || [];
    const notes = milestone.notes || [];
    const allItems = tasks.flatMap(t => [t, ...(t.subtasks || [])]);
    const completedItems = allItems.filter(i => i.status === STATUS.COMPLETE).length;
    const isComplete = status === 'complete';

    const handleSettingsClick = (e) => {
      e.stopPropagation();
      setSettingsMilestone(milestone);
    };

    return (
      <>
        <div
          className="milestone-row w-full p-4 text-left transition-colors cursor-pointer"
          style={{ '--row-hover': darkText ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}
          onClick={() => onSelectMilestone(milestone.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isComplete && <span className="text-sm" style={{ color: textSecondary }}>✓</span>}
                <h3 className="font-semibold truncate" style={{ color: textPrimary }}>{milestone.title}</h3>
              </div>
              <p className="text-sm mt-1" style={{ color: textSecondary }}>{formatDateRange(milestone.startDate, milestone.endDate)}</p>
              <p className="text-xs mt-1.5" style={{ color: textMuted }}>
                {completedItems}/{allItems.length} items {isComplete ? 'completed' : 'done'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CircularProgress completed={completedItems} total={allItems.length} isDark={!darkText} />
              <button
                onClick={handleSettingsClick}
                className="p-2 rounded-full transition-colors"
                style={{ color: textSecondary }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        {showDivider && <div style={{ height: '1px', backgroundColor: cardBorder }} />}
      </>
    );
  };

  // Grouped card for multiple milestones, or single card for one
  const MilestoneGroup = ({ milestones: groupMilestones }) => {
    return (
      <div
        className="milestone-card rounded-2xl backdrop-blur-md overflow-hidden"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          '--glow-color': glowColor,
          '--card-bg-hover': cardHover
        }}
      >
        {groupMilestones.map((m, i) => (
          <MilestoneRow key={m.id} milestone={m} showDivider={i < groupMilestones.length - 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none" style={{ zIndex: 10 }}>
      {/* Card and FAB hover styles */}
      <style>{`
        .milestone-card {
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .milestone-card:hover {
          background-color: var(--card-bg-hover) !important;
          box-shadow: 0 2px 12px var(--glow-color);
        }
        .milestone-card:active {
          transform: scale(0.98);
        }
        .milestone-row:hover {
          background-color: var(--row-hover);
        }
        .milestone-row:active {
          background-color: var(--row-hover);
        }
        .fab-button {
          box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 8px 40px rgba(0,0,0,0.15);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .fab-button:hover {
          background-color: rgba(255,255,255,0.35) !important;
          box-shadow: 0 6px 24px rgba(0,0,0,0.3), 0 12px 48px var(--fab-glow);
        }
        .fab-button:active {
          transform: scale(0.92);
          box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }
      `}</style>

      {/* All content floats above the gradient */}
      <div className="pb-8 px-5" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))' }}>
        {/* Header */}
        <div className="pb-8">
          <div className="flex items-center gap-3 mb-2">
            <FramedLogo color={textPrimary} size={34} />
            <span className="text-2xl font-bold tracking-tight" style={{ color: textPrimary, fontFamily: "'Space Grotesk', sans-serif" }}>Framed</span>
          </div>
          <p className="text-sm font-medium" style={{ color: textSecondary }}>{greeting}</p>
          <p className="text-sm mt-2" style={{ color: textMuted }}>
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} · {activeMilestones.length} active
          </p>
        </div>

        {/* Content */}
        <div className="px-0 sm:px-5 pb-28 space-y-8">
          {milestones.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{ backgroundColor: cardBg }}
              >
                <Calendar className="w-8 h-8" style={{ color: textSecondary }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>No milestones yet</h2>
              <p className="text-sm mt-2 mb-6" style={{ color: textSecondary }}>Create your first milestone to start tracking goals</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-xl font-medium backdrop-blur-md transition-all active:scale-[0.98]"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textPrimary, border: `1px solid ${cardBorder}` }}
              >
                Create Milestone
              </button>
            </div>
          ) : (
            <>
              {activeMilestones.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: textMuted }}>Active</h2>
                  <MilestoneGroup milestones={activeMilestones} />
                </div>
              )}

              {upcomingMilestones.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: textMuted }}>Upcoming</h2>
                  <MilestoneGroup milestones={upcomingMilestones} />
                </div>
              )}

              {completeMilestones.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: textMuted }}>Completed</h2>
                  <MilestoneGroup milestones={completeMilestones} />
                </div>
              )}
            </>
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="fab-button fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-30 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            color: textPrimary,
            border: `1px solid ${cardBorder}`,
            '--fab-glow': darkText ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'
          }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <CreateMilestoneModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={onCreateMilestone} isDark={isDark} currentHour={currentHour} />
      {settingsMilestone && (
        <GoalSettingsModal
          isOpen={true}
          onClose={() => setSettingsMilestone(null)}
          goal={{ title: settingsMilestone.title, startDate: settingsMilestone.startDate, endDate: settingsMilestone.endDate }}
          onSave={(updated) => {
            onUpdateMilestone({ ...settingsMilestone, ...updated });
            setSettingsMilestone(null);
          }}
          onDelete={() => {
            onDeleteMilestone(settingsMilestone.id);
            setSettingsMilestone(null);
          }}
          taskCount={(settingsMilestone.tasks || []).length}
          noteCount={(settingsMilestone.standaloneNotes || []).length}
          isDark={isDark}
        />
      )}
    </div>
  );
}

// Milestone View Component (the existing task list view)
function MilestoneView({ milestone, onUpdateMilestone, onDeleteMilestone, onBack, isDark, currentHour }) {
  const [filterDate, setFilterDate] = useState(DATE_FILTERS.ALL);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState('task');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [notesTask, setNotesTask] = useState(null);
  const [savedSummary, setSavedSummary] = useState(() => localStorage.getItem(LOCAL_SUMMARY_PREFIX + milestone.id) || '');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteDate, setEditNoteDate] = useState('');
  
  const [draggingId, setDraggingId] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const taskListRef = useRef(null);
  const draggedTaskHeight = useRef(0);
  const dragStartY = useRef(0);
  const draggedElRef = useRef(null);
  const originalPositions = useRef([]); // Store original Y positions at drag start
  const dragStartIndex = useRef(0);
  
  const tasks = milestone.tasks || [];
  const standaloneNotes = milestone.standaloneNotes || [];
  const goal = { title: milestone.title, startDate: milestone.startDate, endDate: milestone.endDate };
  
  const allTags = [...new Set(tasks.flatMap(t => t.tags || []))];
  const taskNotesCount = tasks.reduce((sum, t) => sum + (t.notes || []).length, 0);
  const totalNotes = taskNotesCount + standaloneNotes.length;
  
  const today = new Date(); today.setHours(0,0,0,0);
  const startDate = new Date(milestone.startDate); startDate.setHours(0,0,0,0);
  const endDate = new Date(milestone.endDate); endDate.setHours(0,0,0,0);
  const totalDays = Math.ceil((endDate - startDate) / 86400000);
  const daysLeft = Math.ceil((endDate - today) / 86400000);
  const isMilestoneComplete = today > endDate;
  
  const prevAllTagsRef = useRef([]);
  useEffect(() => {
    // Initialize with all tags on first load
    if (selectedTags.length === 0 && allTags.length > 0) {
      setSelectedTags([...allTags]);
      prevAllTagsRef.current = [...allTags];
      return;
    }
    // Only add genuinely NEW tags (not previously deselected ones)
    const prevTags = prevAllTagsRef.current;
    const newTags = allTags.filter(t => !prevTags.includes(t));
    if (newTags.length > 0) {
      setSelectedTags(prev => [...prev, ...newTags]);
    }
    prevAllTagsRef.current = [...allTags];
  }, [allTags.join(',')]);

  const greeting = getGreeting(Math.floor(currentHour));
  const todayFormatted = formatToday();
  
  const handleUpdateTask = (updatedTask) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    onUpdateMilestone({ ...milestone, tasks: newTasks });
    if (notesTask && notesTask.id === updatedTask.id) setNotesTask(updatedTask);
  };

  const handleDeleteTask = (taskId) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    onUpdateMilestone({ ...milestone, tasks: newTasks });
    if (editingTaskId === taskId) setEditingTaskId(null);
  };
  
  const handleAddTask = (task) => {
    onUpdateMilestone({ ...milestone, tasks: [...tasks, task] });
  };
  
  const handleAddNote = (note) => {
    onUpdateMilestone({ ...milestone, standaloneNotes: [...standaloneNotes, note] });
  };
  
  const handleUpdateStandaloneNotes = (newNotes) => {
    onUpdateMilestone({ ...milestone, standaloneNotes: newNotes });
  };
  
  const handleGoalSave = (newGoal) => {
    onUpdateMilestone({ ...milestone, title: newGoal.title, startDate: newGoal.startDate, endDate: newGoal.endDate });
  };
  
  const handleSaveSummary = (summary) => {
    setSavedSummary(summary);
    localStorage.setItem(LOCAL_SUMMARY_PREFIX + milestone.id, summary);
  };
  
  const handleOpenAddModal = (defaultTab) => { setAddModalDefaultTab(defaultTab); setShowAddModal(true); };

  const handleRenameTag = (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    const newTasks = tasks.map(t => ({
      ...t,
      tags: (t.tags || []).map(tag => tag === oldName ? newName.trim() : tag)
    }));
    onUpdateMilestone({ ...milestone, tasks: newTasks });
    setSelectedTags(prev => prev.map(tag => tag === oldName ? newName.trim() : tag));
  };

  const handleDeleteTag = (tagName) => {
    const newTasks = tasks.map(t => ({
      ...t,
      tags: (t.tags || []).filter(tag => tag !== tagName)
    }));
    onUpdateMilestone({ ...milestone, tasks: newTasks });
    setSelectedTags(prev => prev.filter(tag => tag !== tagName));
  };

  // Notes/Journal data and handlers
  const taskNotes = tasks.flatMap(task => (task.notes || []).map(note => ({ ...note, type: 'task', taskId: task.id, taskTitle: task.title, taskTags: task.tags })));
  const standaloneWithType = standaloneNotes.map(note => ({ ...note, type: 'standalone' }));
  const allNotes = [...taskNotes, ...standaloneWithType];
  const sortedNotes = allNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
  const groupedByDate = sortedNotes.reduce((acc, note) => { const dateKey = note.date; if (!acc[dateKey]) acc[dateKey] = []; acc[dateKey].push(note); return acc; }, {});
  const dateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  const handleStartEditNote = (note) => { setEditingNoteId(note.id); setEditNoteContent(note.content); setEditNoteDate(note.date); };
  const handleSaveEditNote = (note) => {
    if (note.type === 'standalone') { handleUpdateStandaloneNotes(standaloneNotes.map(n => n.id === note.id ? { ...n, content: editNoteContent, date: editNoteDate } : n)); }
    else { const task = tasks.find(t => t.id === note.taskId); if (task) handleUpdateTask({ ...task, notes: task.notes.map(n => n.id === note.id ? { ...n, content: editNoteContent, date: editNoteDate } : n) }); }
    setEditingNoteId(null);
  };
  const handleDeleteNote = (note) => {
    if (note.type === 'standalone') { handleUpdateStandaloneNotes(standaloneNotes.filter(n => n.id !== note.id)); }
    else { const task = tasks.find(t => t.id === note.taskId); if (task) handleUpdateTask({ ...task, notes: task.notes.filter(n => n.id !== note.id) }); }
  };

  // Filtered tasks - computed before drag handlers that depend on it
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterDate === DATE_FILTERS.TODAY) result = result.filter(t => isToday(t.dueDate));
    if (selectedTags.length < allTags.length && selectedTags.length > 0) {
      result = result.filter(t => (t.tags || []).some(tag => selectedTags.includes(tag)) || !(t.tags || []).length);
    }
    return result;
  }, [tasks, filterDate, selectedTags, allTags]);

  // Drag handlers
  const handleDragStart = useCallback((taskId, e) => {
    const taskElements = taskListRef.current?.querySelectorAll('[data-task-id]');
    if (!taskElements) return;

    // Store original positions of ALL items before any transforms
    const positions = [];
    taskElements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      positions.push({
        id: el.getAttribute('data-task-id'),
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        midY: rect.top + rect.height / 2
      });
    });
    originalPositions.current = positions;

    // Store the element ref for direct DOM manipulation
    const el = taskListRef.current?.querySelector(`[data-task-id="${taskId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      draggedTaskHeight.current = rect.height + 8; // +8 for gap
      draggedElRef.current = el;
    }

    // Store initial cursor position and drag index
    const clientY = e?.touches ? e.touches[0].clientY : (e?.clientY || 0);
    dragStartY.current = clientY;
    const dragIdx = filteredTasks.findIndex(t => t.id === taskId);
    dragStartIndex.current = dragIdx;

    setDraggingId(taskId);
    setDropIndex(dragIdx);
    if (navigator.vibrate) navigator.vibrate(50);
  }, [filteredTasks]);

  const handleDragMove = useCallback((e) => {
    if (!draggingId || !taskListRef.current) return;
    if (e.cancelable) e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Directly update dragged element transform for instant response
    const offset = clientY - dragStartY.current;
    if (draggedElRef.current) {
      draggedElRef.current.style.transform = `translateY(${offset}px)`;
    }

    // Use original positions to find drop index
    const positions = originalPositions.current;
    const startIdx = dragStartIndex.current;

    // Calculate drop index based on which item's midpoint we've crossed
    let newDropIndex = startIdx;

    // Check items below the start position (dragging down)
    for (let i = startIdx + 1; i < positions.length; i++) {
      if (clientY > positions[i].midY) {
        newDropIndex = i;
      } else {
        break;
      }
    }

    // Check items above the start position (dragging up)
    for (let i = startIdx - 1; i >= 0; i--) {
      if (clientY < positions[i].midY) {
        newDropIndex = i;
      } else {
        break;
      }
    }

    // Only update state if drop index changed
    if (newDropIndex !== dropIndex) {
      setDropIndex(newDropIndex);
    }
  }, [draggingId, dropIndex]);

  const handleDragEnd = useCallback(() => {
    if (draggingId && dropIndex !== null) {
      const dragIndex = filteredTasks.findIndex(t => t.id === draggingId);
      if (dragIndex !== -1 && dropIndex !== dragIndex) {
        const newTasks = [...tasks];
        const originalDragIndex = newTasks.findIndex(t => t.id === draggingId);
        // Map dropIndex from filtered to original tasks
        const targetTask = filteredTasks[dropIndex];
        const originalDropIndex = targetTask ? newTasks.findIndex(t => t.id === targetTask.id) : newTasks.length - 1;

        if (originalDragIndex !== -1 && originalDropIndex !== -1) {
          const [draggedTask] = newTasks.splice(originalDragIndex, 1);
          const adjustedDropIndex = originalDropIndex > originalDragIndex ? originalDropIndex : originalDropIndex;
          newTasks.splice(adjustedDropIndex, 0, draggedTask);
          onUpdateMilestone({ ...milestone, tasks: newTasks });
        }
      }
    }
    // Reset the dragged element's transform and clean up refs
    if (draggedElRef.current) {
      draggedElRef.current.style.transform = '';
      draggedElRef.current = null;
    }
    originalPositions.current = [];
    setDraggingId(null);
    setDropIndex(null);
  }, [draggingId, dropIndex, tasks, filteredTasks, milestone, onUpdateMilestone]);

  // Calculate shift transform for each task based on drag position
  const getTaskShiftStyle = useCallback((taskId, taskIndex) => {
    if (!draggingId || draggingId === taskId) return {};
    const dragIndex = filteredTasks.findIndex(t => t.id === draggingId);
    if (dragIndex === -1 || dropIndex === null) return {};

    const height = draggedTaskHeight.current;

    // If dragging down (dropIndex > dragIndex)
    if (dropIndex > dragIndex) {
      // Items between drag and drop should shift up
      if (taskIndex > dragIndex && taskIndex <= dropIndex) {
        return { transform: `translateY(-${height}px)` };
      }
    }
    // If dragging up (dropIndex < dragIndex)
    else if (dropIndex < dragIndex) {
      // Items between drop and drag should shift down
      if (taskIndex >= dropIndex && taskIndex < dragIndex) {
        return { transform: `translateY(${height}px)` };
      }
    }
    return {};
  }, [draggingId, dropIndex, filteredTasks]);

  useEffect(() => {
    if (draggingId) {
      const handleMove = (e) => handleDragMove(e);
      const handleEnd = () => handleDragEnd();
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      // Prevent scrolling and text selection during drag
      document.body.style.overflow = 'hidden';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.body.style.overflow = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      };
    }
  }, [draggingId, handleDragMove, handleDragEnd]);

  const todayCount = tasks.filter(t => isToday(t.dueDate) && t.status !== STATUS.COMPLETE).length;
  const allItems = tasks.flatMap(t => [t, ...(t.subtasks || [])]);
  const completedItems = allItems.filter(i => i.status === STATUS.COMPLETE).length;
  const isTagFiltering = selectedTags.length < allTags.length && selectedTags.length > 0;
  
  // Colors for the overlay and content
  const { colors, darkText: timeBasedDarkText } = getTimeColors(currentHour);
  const textPrimary = timeBasedDarkText ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,1)';
  const textSecondaryOverlay = timeBasedDarkText ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
  const textMuted = timeBasedDarkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';
  const cardBg = timeBasedDarkText ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)';
  const cardBorder = timeBasedDarkText ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';

  // Subtle gradient for the card overlay - darker version of the base gradient
  const cardGradient = timeBasedDarkText
    ? `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.15) 100%)`
    : `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.45) 100%)`;

  // Legacy colors for task items (keep existing filter styling)
  const bgColor = isDark ? '#111827' : '#f9fafb';
  const filterBg = isDark ? '#1f2937' : '#f3f4f6';
  const filterActiveBg = isDark ? '#f3f4f6' : '#111827';
  const filterText = isDark ? '#d1d5db' : '#374151';
  const filterActiveText = isDark ? '#111827' : '#ffffff';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';

  return (
    <div
      className="fixed top-14 rounded-3xl backdrop-blur-md overflow-hidden"
      style={{
        left: '4px',
        right: '4px',
        bottom: '4px',
        background: cardGradient,
        border: `1px solid ${cardBorder}`
      }}
    >
      {/* FAB hover styles */}
      <style>{`
        .fab-button {
          box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 8px 40px rgba(0,0,0,0.15);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .fab-button:hover {
          background-color: rgba(255,255,255,0.35) !important;
          box-shadow: 0 6px 24px rgba(0,0,0,0.3), 0 12px 48px var(--fab-glow);
        }
        .fab-button:active {
          transform: scale(0.92);
          box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }
      `}</style>

      {/* Scrollable content */}
      <div className="relative h-full overflow-y-auto pb-24">
        {/* Header */}
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>
                {milestone.title}
              </h1>
              <p className="text-sm mt-1" style={{ color: textSecondaryOverlay }}>
                {new Date(milestone.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {new Date(milestone.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}{isMilestoneComplete && ' · Finished!'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CircularCountdown daysLeft={daysLeft} totalDays={totalDays} darkText={timeBasedDarkText} isComplete={isMilestoneComplete} />
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-full"
                style={{ color: textSecondaryOverlay }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium" style={{ color: textPrimary }}>{isMilestoneComplete ? 'Final Progress' : 'Overall Progress'}</span>
              <span style={{ color: textSecondaryOverlay }}>{completedItems}/{allItems.length}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: timeBasedDarkText ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)' }}>
              <div className="h-full transition-all" style={{ width: `${allItems.length ? (completedItems / allItems.length) * 100 : 0}%`, backgroundColor: timeBasedDarkText ? 'rgba(0,0,0,0.7)' : 'white' }} />
            </div>
          </div>
        </div>

        {isMilestoneComplete && (
          <div className="px-4 mt-4">
            <MilestoneSummary tasks={tasks} standaloneNotes={standaloneNotes} goal={goal} isDark={isDark} savedSummary={savedSummary} onSaveSummary={handleSaveSummary} />
          </div>
        )}

        {/* Filters - use glass morphism style */}
        <div className="px-4 mt-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
              {isMilestoneComplete ? (
                <button onClick={() => setFilterDate(DATE_FILTERS.ALL)} className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap backdrop-blur-md" style={{ backgroundColor: filterDate === DATE_FILTERS.ALL ? cardBg : 'rgba(255,255,255,0.1)', color: textPrimary, border: `1px solid ${cardBorder}` }}>All Tasks</button>
              ) : (
                <>
                  <button onClick={() => setFilterDate(DATE_FILTERS.ALL)} className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap backdrop-blur-md" style={{ backgroundColor: filterDate === DATE_FILTERS.ALL ? cardBg : 'rgba(255,255,255,0.1)', color: textPrimary, border: `1px solid ${cardBorder}` }}>All</button>
                  <button onClick={() => setFilterDate(DATE_FILTERS.TODAY)} className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md" style={{ backgroundColor: filterDate === DATE_FILTERS.TODAY ? cardBg : 'rgba(255,255,255,0.1)', color: textPrimary, border: `1px solid ${cardBorder}` }}>Today{todayCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-500 text-white">{todayCount}</span>}</button>
                </>
              )}
              <button onClick={() => setShowTagsModal(true)} className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md" style={{ backgroundColor: isTagFiltering ? cardBg : 'rgba(255,255,255,0.1)', color: textPrimary, border: `1px solid ${cardBorder}` }}><Tag className="w-3.5 h-3.5" />Tags{isTagFiltering && <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: textPrimary }}>{selectedTags.length}/{allTags.length}</span>}</button>
            </div>
            <div className="flex rounded-full backdrop-blur-md flex-shrink-0 p-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: `1px solid ${cardBorder}` }}>
              <button
                onClick={() => setShowJournal(false)}
                className="px-2 sm:px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: !showJournal ? cardBg : 'transparent', color: !showJournal ? textPrimary : textSecondaryOverlay }}
              >
                <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Tasks</span>
              </button>
              <button
                onClick={() => setShowJournal(true)}
                className="px-2 sm:px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: showJournal ? cardBg : 'transparent', color: showJournal ? textPrimary : textSecondaryOverlay }}
              >
                <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Notes</span>
                {totalNotes > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-500 text-white">{totalNotes > 9 ? '9+' : totalNotes}</span>}
              </button>
            </div>
          </div>
          {isTagFiltering && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs py-0.5 pl-2 pr-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: textSecondaryOverlay }}>
                  {tag}
                  <button onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} className="p-0.5 rounded-full hover:bg-white/10">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Task list / Notes list with fade transition */}
        <div className="px-4 mt-4 pb-24 relative">
          {/* Tasks */}
          <div
            className="space-y-2 transition-opacity duration-200"
            style={{ opacity: showJournal ? 0 : 1, pointerEvents: showJournal ? 'none' : 'auto', position: showJournal ? 'absolute' : 'relative', inset: showJournal ? 0 : 'auto' }}
            ref={taskListRef}
          >
            {filteredTasks.map((task, index) => {
              const isDragged = draggingId === task.id;
              return (
                <div
                  key={task.id}
                  data-task-id={task.id}
                  style={{
                    transition: isDragged ? 'none' : (draggingId ? 'transform 0.12s cubic-bezier(0.2, 0, 0, 1)' : 'none'),
                    ...(!isDragged && getTaskShiftStyle(task.id, index)),
                    zIndex: isDragged ? 50 : 1,
                    position: 'relative',
                    willChange: draggingId ? 'transform' : 'auto'
                  }}
                >
                  <TaskItem task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} allTags={allTags} isDark={isDark} onOpenNotes={setNotesTask} onDragStart={handleDragStart} isDragging={isDragged} isMilestoneComplete={isMilestoneComplete} isEditing={editingTaskId === task.id} onSetEditing={setEditingTaskId} />
                </div>
              );
            })}
            {!filteredTasks.length && <div className="text-center py-12" style={{ color: textSecondaryOverlay }}>{filterDate !== DATE_FILTERS.ALL || isTagFiltering ? 'No tasks match filters' : 'No tasks yet'}</div>}
          </div>

          {/* Notes */}
          <div
            className="space-y-4 transition-opacity duration-200"
            style={{ opacity: showJournal ? 1 : 0, pointerEvents: showJournal ? 'auto' : 'none', position: showJournal ? 'relative' : 'absolute', inset: showJournal ? 'auto' : 0 }}
          >
            {dateKeys.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: textSecondaryOverlay, opacity: 0.5 }} />
                <p className="text-sm" style={{ color: textSecondaryOverlay }}>No notes yet</p>
              </div>
            ) : (
              dateKeys.map(dateKey => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: textSecondaryOverlay }}>{formatNoteDateFull(dateKey)}</h3>
                  </div>
                  <div className="ml-3 pl-3 space-y-2" style={{ borderLeft: `2px solid ${cardBorder}` }}>
                    {groupedByDate[dateKey].map(note => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl backdrop-blur-md cursor-pointer"
                        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                        onClick={() => { if (editingNoteId !== note.id) handleStartEditNote(note); }}
                      >
                        {editingNoteId === note.id ? (
                          <div className="space-y-3" onClick={e => e.stopPropagation()}>
                            {/* Top row - actions */}
                            <div className="flex items-center justify-between min-h-[32px] -mt-1">
                              <button onClick={() => handleDeleteNote(note)} className="text-xs px-2 py-1 text-red-400">Delete</button>
                              <button onClick={() => handleSaveEditNote(note)} className="text-sm text-blue-400 font-medium px-3 py-1 rounded-lg active:bg-blue-500/10">Done</button>
                            </div>
                            {/* Content input */}
                            <textarea
                              value={editNoteContent}
                              onChange={(e) => setEditNoteContent(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Escape') setEditingNoteId(null); }}
                              rows={4}
                              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                              style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid #3b82f6', color: textPrimary, minHeight: '100px' }}
                              autoFocus
                            />
                            {/* Date and tag row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <input type="date" value={editNoteDate} onChange={(e) => setEditNoteDate(e.target.value)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${cardBorder}`, color: textPrimary, colorScheme: 'dark' }} />
                              {note.type === 'task' && (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: textSecondaryOverlay }}>{note.taskTitle}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm" style={{ color: textPrimary }}>{note.content}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {note.type === 'task' ? (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: textSecondaryOverlay }}>{note.taskTitle}</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>Journal</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FAB */}
        <button onClick={() => handleOpenAddModal(showJournal ? 'note' : 'task')} className="fab-button fixed w-14 h-14 rounded-full flex items-center justify-center z-30 backdrop-blur-md" style={{ bottom: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.25)', color: textPrimary, border: `1px solid ${cardBorder}`, '--fab-glow': timeBasedDarkText ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }}><Plus className="w-6 h-6" /></button>
      </div>
      
      <TagsModal isOpen={showTagsModal} onClose={() => setShowTagsModal(false)} allTags={allTags} selectedTags={selectedTags} onTagsChange={setSelectedTags} onRenameTag={handleRenameTag} onDeleteTag={handleDeleteTag} isDark={isDark} />
      <AddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} defaultTab={addModalDefaultTab} onAddTask={handleAddTask} onAddNote={handleAddNote} allTags={allTags} isDark={isDark} currentHour={currentHour} />
      <GoalSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        goal={goal}
        onSave={handleGoalSave}
        onDelete={() => { onDeleteMilestone(milestone.id); onBack(); }}
        taskCount={tasks.length}
        noteCount={standaloneNotes.length}
        isDark={isDark}
      />
      <NotesModal isOpen={!!notesTask} onClose={() => setNotesTask(null)} task={notesTask} onUpdateTask={handleUpdateTask} isDark={isDark} />
    </div>
  );
}

export default function VacationTracker() {
  const [milestones, setMilestones] = useState([]);
  const [currentView, setCurrentView] = useState({ view: VIEWS.DASHBOARD });
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours() + new Date().getMinutes() / 60);

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayView, setDisplayView] = useState({ view: VIEWS.DASHBOARD });

  // Determine dark mode based on gradient colors, not system preference
  // When darkText is true, gradient is light (use light mode)
  // When darkText is false, gradient is dark (use dark mode)
  const { darkText: gradientIsLight } = getTimeColors(currentHour);
  const isDark = !gradientIsLight;

  useEffect(() => {
    const i = setInterval(() => setCurrentHour(new Date().getHours() + new Date().getMinutes() / 60), 60000);
    return () => clearInterval(i);
  }, []);

  // Helper to update Safari bottom toolbar color based on view
  const updateBottomToolbarColor = useCallback((forMilestoneView) => {
    const { colors, darkText } = getTimeColors(currentHour);
    let bottomColor = colors[3];
    if (forMilestoneView) {
      // Card overlay uses rgba(0,0,0,0.45) for dark gradients, rgba(0,0,0,0.15) for light
      const darkenAmount = darkText ? 0.15 : 0.45;
      const r = parseInt(colors[3].slice(1, 3), 16);
      const g = parseInt(colors[3].slice(3, 5), 16);
      const b = parseInt(colors[3].slice(5, 7), 16);
      const dr = Math.round(r * (1 - darkenAmount));
      const dg = Math.round(g * (1 - darkenAmount));
      const db = Math.round(b * (1 - darkenAmount));
      bottomColor = `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
    }
    document.body.style.backgroundColor = bottomColor;
  }, [currentHour]);

  // Update theme-color meta tag and body background to match gradient (for Safari toolbars)
  const isMilestoneView = displayView.view === VIEWS.MILESTONE && displayView.milestoneId;

  useEffect(() => {
    const { colors } = getTimeColors(currentHour);

    // Update meta theme-color for Safari toolbar (top) - use colors[0]
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors[0]);
    }

    // Update bottom toolbar color based on current view
    updateBottomToolbarColor(isMilestoneView);
  }, [currentHour, isMilestoneView, updateBottomToolbarColor]);
  
  // Initial load from localStorage
  useEffect(() => {
    const savedMilestones = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedMilestones) {
      const parsed = JSON.parse(savedMilestones);
      setMilestones(parsed);
    }
    
    const savedView = localStorage.getItem(LOCAL_VIEW_KEY);
    if (savedView) {
      const parsed = JSON.parse(savedView);
      // Validate the lastView - make sure milestone still exists
      if (parsed.view === VIEWS.MILESTONE && parsed.milestoneId) {
        const savedMs = savedMilestones ? JSON.parse(savedMilestones) : [];
        const exists = savedMs.some(m => m.id === parsed.milestoneId);
        if (exists) {
          setCurrentView(parsed);
          setDisplayView(parsed);
        }
      } else {
        setCurrentView(parsed);
        setDisplayView(parsed);
      }
    }

    setLoading(false);
  }, []);
  
  // Save milestones to localStorage when they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(milestones));
    }
  }, [milestones, loading]);
  
  // Save view to localStorage when it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LOCAL_VIEW_KEY, JSON.stringify(currentView));
    }
  }, [currentView, loading]);
  
  // Handle view transitions with fade
  const navigateTo = useCallback((newView, { pushHistory = true } = {}) => {
    setIsTransitioning(true);
    // Immediately update Safari bottom toolbar color for the target view
    const targetIsMilestone = newView.view === VIEWS.MILESTONE && newView.milestoneId;
    updateBottomToolbarColor(targetIsMilestone);
    // Wait for fade out, then switch view
    setTimeout(() => {
      setDisplayView(newView);
      setCurrentView(newView);
      // Push to browser history (unless this is from popstate)
      if (pushHistory) {
        const url = newView.view === VIEWS.MILESTONE && newView.milestoneId
          ? `?milestone=${newView.milestoneId}`
          : '/';
        window.history.pushState(newView, '', url);
      }
      // Small delay then fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  }, [updateBottomToolbarColor]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const newView = event.state || { view: VIEWS.DASHBOARD };
      // Update toolbar color immediately
      const targetIsMilestone = newView.view === VIEWS.MILESTONE && newView.milestoneId;
      updateBottomToolbarColor(targetIsMilestone);
      // Directly update view state (no transition delay for back/forward)
      setDisplayView(newView);
      setCurrentView(newView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [updateBottomToolbarColor]);

  // Set initial history state on mount
  useEffect(() => {
    const initialUrl = displayView.view === VIEWS.MILESTONE && displayView.milestoneId
      ? `?milestone=${displayView.milestoneId}`
      : '/';
    window.history.replaceState(displayView, '', initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleSelectMilestone = (milestoneId) => {
    navigateTo({ view: VIEWS.MILESTONE, milestoneId });
  };

  const handleBackToDashboard = () => {
    navigateTo({ view: VIEWS.DASHBOARD });
  };

  const handleCreateMilestone = (newMilestone) => {
    setMilestones([...milestones, newMilestone]);
    navigateTo({ view: VIEWS.MILESTONE, milestoneId: newMilestone.id });
  };
  
  const handleUpdateMilestone = (updatedMilestone) => {
    setMilestones(milestones.map(m => m.id === updatedMilestone.id ? updatedMilestone : m));
  };

  const handleDeleteMilestone = (milestoneId) => {
    setMilestones(milestones.filter(m => m.id !== milestoneId));
  };
  
  const bgColor = isDark ? '#111827' : '#f9fafb';
  const { colors } = getTimeColors(currentHour);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  // Render content based on displayView (for smooth transitions)
  const renderContent = () => {
    if (displayView.view === VIEWS.MILESTONE && displayView.milestoneId) {
      const milestone = milestones.find(m => m.id === displayView.milestoneId);
      if (milestone) {
        return (
          <MilestoneView
            milestone={milestone}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onBack={handleBackToDashboard}
            isDark={isDark}
            currentHour={currentHour}
          />
        );
      }
    }

    return (
      <Dashboard
        milestones={milestones}
        onSelectMilestone={handleSelectMilestone}
        onCreateMilestone={handleCreateMilestone}
        onUpdateMilestone={handleUpdateMilestone}
        onDeleteMilestone={handleDeleteMilestone}
        isDark={isDark}
        currentHour={currentHour}
      />
    );
  };

  const { darkText: timeBasedDarkText } = getTimeColors(currentHour);
  const topBarTextColor = timeBasedDarkText ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)';

  return (
    <>
      {/* Page transition styles */}
      <style>{`
        .page-transition {
          transition: opacity 0.3s ease;
        }
        .page-transition.fade-out {
          opacity: 0;
        }
        .page-transition.fade-in {
          opacity: 1;
        }
      `}</style>

      {/* Shared background that persists across transitions */}
      <ImmersiveBackground colors={colors} darkText={false} />

      {/* Fixed header bar when viewing a milestone - transparent to show gradient behind */}
      {isMilestoneView && (
        <div className="fixed top-0 left-0 right-0 h-14 z-40">
          <button
            onClick={handleBackToDashboard}
            onTouchEnd={(e) => { e.preventDefault(); handleBackToDashboard(); }}
            className="w-full h-full flex items-center gap-2 px-4 cursor-pointer"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <FramedLogo color={topBarTextColor} size={20} />
            <span className="text-base font-semibold" style={{ color: topBarTextColor, fontFamily: "'Space Grotesk', sans-serif" }}>Framed</span>
          </button>
        </div>
      )}

      {/* Content with transition */}
      <div className={`page-transition relative z-10 ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        {renderContent()}
      </div>
    </>
  );
}
