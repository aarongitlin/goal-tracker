import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Circle, Clock, Plus, X, ChevronDown, ChevronRight, Loader2, Settings, Calendar, Tag, MessageSquare, BookOpen, ChevronLeft, GripVertical, Sparkles, ChevronUp, Home, RefreshCw } from 'lucide-react';

const STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETE: 'complete'
};

const DEFAULT_TAGS = ['Learning', 'Health', 'Projects', 'Work', 'Personal', 'Planning'];

const DATE_FILTERS = {
  ALL: 'all',
  TODAY: 'today'
};

const VIEWS = {
  DASHBOARD: 'dashboard',
  MILESTONE: 'milestone'
};

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
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

function getTimeGradient(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 22 || h < 5) return { gradient: `radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(49, 46, 129, 0.6) 0%, transparent 50%), linear-gradient(to bottom, #1e1b4b 0%, #312e81 40%, #1e293b 100%)`, darkText: false };
  if (h >= 5 && h < 6.5) return { gradient: `radial-gradient(ellipse at 70% 30%, rgba(99, 102, 241, 0.5) 0%, transparent 50%), linear-gradient(to bottom, #312e81 0%, #3730a3 30%, #1e3a8a 70%, #1e293b 100%)`, darkText: false };
  if (h >= 6.5 && h < 8) return { gradient: `radial-gradient(ellipse at 70% 20%, rgba(251, 191, 36, 0.4) 0%, transparent 40%), linear-gradient(to bottom, #fda4af 0%, #fb923c 25%, #f472b6 60%, #c026d3 100%)`, darkText: false };
  if (h >= 8 && h < 11) return { gradient: `radial-gradient(ellipse at 50% 0%, rgba(253, 224, 71, 0.6) 0%, transparent 50%), linear-gradient(to bottom, #fde047 0%, #fbbf24 40%, #fb923c 100%)`, darkText: true };
  if (h >= 11 && h < 16) return { gradient: `radial-gradient(ellipse at 50% 30%, rgba(254, 249, 195, 0.5) 0%, transparent 40%), linear-gradient(to bottom, #fef08a 0%, #fde047 30%, #fbbf24 70%, #f59e0b 100%)`, darkText: true };
  if (h >= 16 && h < 18) return { gradient: `radial-gradient(ellipse at 30% 20%, rgba(251, 146, 60, 0.5) 0%, transparent 40%), linear-gradient(to bottom, #fb923c 0%, #f97316 25%, #f43f5e 60%, #be185d 100%)`, darkText: false };
  if (h >= 18 && h < 20) return { gradient: `radial-gradient(ellipse at 60% 20%, rgba(192, 132, 252, 0.4) 0%, transparent 40%), linear-gradient(to bottom, #a855f7 0%, #7c3aed 30%, #6d28d9 60%, #4c1d95 100%)`, darkText: false };
  return { gradient: `radial-gradient(ellipse at 40% 30%, rgba(124, 58, 237, 0.3) 0%, transparent 40%), linear-gradient(to bottom, #581c87 0%, #4c1d95 30%, #312e81 70%, #1e293b 100%)`, darkText: false };
}

function getMilestoneCompleteGradient() {
  return {
    gradient: `radial-gradient(ellipse at 30% 20%, rgba(74, 222, 128, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%), linear-gradient(135deg, #065f46 0%, #047857 25%, #0d9488 50%, #0891b2 75%, #0284c7 100%)`,
    darkText: false
  };
}

function TagsModal({ isOpen, onClose, allTags, selectedTags, onTagsChange, isDark }) {
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
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="w-full sm:max-w-sm sm:rounded-xl rounded-t-xl max-h-[70vh] overflow-hidden" style={{ backgroundColor: modalBg }} onClick={e => e.stopPropagation()}>
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
              <button key={tag} onClick={() => toggleTag(tag)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: selectedTags.includes(tag) ? itemBg : 'transparent' }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: selectedTags.includes(tag) ? '#3b82f6' : 'transparent', border: selectedTags.includes(tag) ? 'none' : `2px solid ${isDark ? '#4b5563' : '#d1d5db'}` }}>
                  {selectedTags.includes(tag) && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-base font-medium" style={{ color: textPrimary }}>{tag}</span>
              </button>
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
        <div className="flex items-center gap-1">
          <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewTag(); } if (e.key === 'Escape') { setIsAddingNew(false); setNewTagInput(''); }}} placeholder="Tag name..." className="px-2 py-1 text-sm rounded-full w-24" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? '#f3f4f6' : '#111827' }} autoFocus />
          <button type="button" onClick={handleAddNewTag} className="p-1.5 bg-blue-500 text-white rounded-full"><Check className="w-3 h-3" /></button>
          <button type="button" onClick={() => { setIsAddingNew(false); setNewTagInput(''); }} className="p-1.5 rounded-full" style={{ backgroundColor: buttonBg, color: buttonText }}><X className="w-3 h-3" /></button>
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

function GoalSettingsModal({ isOpen, onClose, goal, onSave, isDark }) {
  const [title, setTitle] = useState(goal.title);
  const [startDate, setStartDate] = useState(goal.startDate);
  const [endDate, setEndDate] = useState(goal.endDate);
  
  useEffect(() => { if (isOpen) { setTitle(goal.title); setStartDate(goal.startDate); setEndDate(goal.endDate); } }, [isOpen, goal]);
  
  if (!isOpen) return null;
  
  const modalBg = isDark ? '#1f2937' : '#ffffff';
  const inputBg = isDark ? '#111827' : '#ffffff';
  const inputBorder = isDark ? '#374151' : '#d1d5db';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#374151';
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="w-full sm:max-w-md sm:rounded-xl rounded-t-xl" style={{ backgroundColor: modalBg }}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${inputBorder}` }}>
          <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Milestone Settings</h2>
          <button onClick={onClose} style={{ color: textSecondary }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
            </div>
          </div>
          <button onClick={() => { onSave({ title, startDate, endDate }); onClose(); }} className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}

function CreateMilestoneModal({ isOpen, onClose, onCreate, isDark }) {
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="w-full sm:max-w-md sm:rounded-xl rounded-t-xl" style={{ backgroundColor: modalBg }} onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${inputBorder}` }}>
          <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>New Milestone</h2>
          <button onClick={onClose} style={{ color: textSecondary }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q1 Goals, Vacation, Sprint 5..." className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={!title.trim()} className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50">Create Milestone</button>
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: modalBg }} onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center flex-shrink-0" style={{ borderBottom: `1px solid ${inputBorder}` }}>
          <div><h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Notes</h2><p className="text-sm" style={{ color: textSecondary }}>{task.title}</p></div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ color: textSecondary }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${inputBorder}` }}>
          <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Add a note..." rows={2} className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: textSecondary }} /><input type="date" value={newNoteDate} onChange={(e) => setNewNoteDate(e.target.value)} className="text-sm px-2 py-1 rounded" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} /></div>
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
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="text-sm px-2 py-1 rounded" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
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
          <div className="text-center py-16"><MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: textSecondary }} /><p className="text-lg font-medium" style={{ color: textPrimary }}>No notes yet</p><p className="text-sm mt-1" style={{ color: textSecondary }}>Tap + to add your first note</p></div>
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
                            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="text-sm px-2 py-1 rounded" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} />
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
  const LONG_PRESS_DURATION = 300;
  const textMuted = isDark ? '#6b7280' : '#9ca3af';
  
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const preventScroll = (e) => { if (isPressing.current) e.preventDefault(); };
    handle.addEventListener('touchmove', preventScroll, { passive: false });
    return () => { handle.removeEventListener('touchmove', preventScroll); };
  }, []);
  
  const startPress = (e) => { isPressing.current = true; didLongPress.current = false; longPressRef.current = setTimeout(() => { didLongPress.current = true; onDragStart?.(e); }, LONG_PRESS_DURATION); };
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

function TaskItem({ task, onUpdate, allTags, isDark, onOpenNotes, onDragStart, isDragging, isDropTarget, isMilestoneComplete }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [dueDateValue, setDueDateValue] = useState(task.dueDate || '');
  const [newSubtask, setNewSubtask] = useState('');
  
  const handleTap = (currentStatus) => currentStatus === STATUS.COMPLETE ? STATUS.NOT_STARTED : STATUS.COMPLETE;
  const handleLongPress = (currentStatus) => currentStatus === STATUS.IN_PROGRESS ? STATUS.NOT_STARTED : STATUS.IN_PROGRESS;
  const handleSave = () => { if (titleValue.trim()) onUpdate({ ...task, title: titleValue.trim(), dueDate: dueDateValue || null }); setEditing(false); };
  const handleAddSubtask = () => { if (newSubtask.trim()) { onUpdate({ ...task, subtasks: [...task.subtasks, { id: `${task.id}-${Date.now()}`, title: newSubtask.trim(), status: STATUS.NOT_STARTED }] }); setNewSubtask(''); } };
  const handleCardClick = (e) => { if (editing || isDragging) return; if (e.target.closest('button') || e.target.closest('input') || e.target.closest('[data-drag-handle]')) return; setTitleValue(task.title); setDueDateValue(task.dueDate || ''); setEditing(true); };
  
  const completedSubtasks = task.subtasks.filter(st => st.status === STATUS.COMPLETE).length;
  const hasSubtasks = task.subtasks.length > 0;
  const noteCount = (task.notes || []).length;
  
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const cardBorder = isDark ? '#374151' : '#f3f4f6';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const textMuted = isDark ? '#6b7280' : '#9ca3af';
  const subtaskBg = isDark ? 'rgba(31,41,55,0.5)' : '#f9fafb';
  const inputBg = isDark ? '#111827' : '#f9fafb';
  
  const dragStyle = isDragging ? { opacity: 0.5, transform: 'scale(1.02)', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' } : isDropTarget ? { borderColor: '#3b82f6', borderWidth: '2px' } : {};
  
  return (
    <div className={`rounded-xl shadow-sm overflow-hidden transition-all ${task.status === STATUS.COMPLETE ? 'opacity-50' : ''}`} style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, ...dragStyle }}>
      <div className="px-3 py-2.5" onClick={handleCardClick}>
        <div className="flex items-center gap-3">
          <StatusButton status={task.status} onTap={() => onUpdate({ ...task, status: handleTap(task.status) })} onLongPress={() => onUpdate({ ...task, status: handleLongPress(task.status) })} isDark={isDark} />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                <input type="text" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }} className="w-full text-sm font-medium px-2 py-1 rounded" style={{ backgroundColor: inputBg, border: '1px solid #3b82f6', color: textPrimary }} autoFocus />
                {!isMilestoneComplete && (
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: textMuted }} /><input type="date" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} className="text-sm px-2 py-1 rounded" style={{ backgroundColor: inputBg, color: textPrimary }} />{dueDateValue && <button onClick={() => setDueDateValue('')} style={{ color: textMuted }}><X className="w-3 h-3" /></button>}</div>
                )}
                <TagEditor selectedTags={task.tags} onTagsChange={(tags) => onUpdate({ ...task, tags })} allTags={allTags} isDark={isDark} />
                <div className="flex items-center gap-3"><button onClick={handleSave} className="text-sm text-blue-500 font-medium">Done</button><button onClick={() => onOpenNotes(task)} className="text-sm flex items-center gap-1" style={{ color: textSecondary }}><MessageSquare className="w-3.5 h-3.5" />{noteCount > 0 ? `${noteCount} notes` : 'Add note'}</button></div>
              </div>
            ) : (
              <><p className={`text-sm font-medium leading-snug ${task.status === STATUS.COMPLETE ? 'line-through' : ''}`} style={{ color: task.status === STATUS.COMPLETE ? textSecondary : textPrimary }}>{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {!isMilestoneComplete && <DateBadge dueDate={task.dueDate} isDark={isDark} />}
                  {task.tags.map(tag => <TagBadge key={tag} tag={tag} isDark={isDark} />)}
                  {noteCount > 0 && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(task); }} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe', color: isDark ? '#93c5fd' : '#2563eb' }}><MessageSquare className="w-3 h-3" />{noteCount}</button>}
                  {hasSubtasks && <><span className="text-xs" style={{ color: textMuted }}>·</span><button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-xs flex items-center gap-0.5" style={{ color: textSecondary }}>{expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}{completedSubtasks}/{task.subtasks.length}</button></>}
                </div>
              </>
            )}
          </div>
          {!editing && <div data-drag-handle onClick={e => e.stopPropagation()}><DragHandle isDark={isDark} onDragStart={() => onDragStart(task.id)} isDragging={isDragging} /></div>}
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
              <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newSubtask.trim()) handleAddSubtask(); }} placeholder="Add subtask..." className="flex-1 text-sm bg-transparent focus:outline-none" style={{ color: textPrimary }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddModal({ isOpen, onClose, defaultTab, onAddTask, onAddNote, allTags, isDark }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  useEffect(() => { if (isOpen) { setActiveTab(defaultTab); setTitle(''); setSelectedTags([]); setDueDate(''); setNoteContent(''); setNoteDate(new Date().toISOString().split('T')[0]); } }, [isOpen, defaultTab]);
  
  const handleSubmitTask = (e) => { e.preventDefault(); if (!title.trim()) return; onAddTask({ id: Date.now().toString(), title: title.trim(), status: STATUS.NOT_STARTED, tags: selectedTags, dueDate: dueDate || null, subtasks: [], notes: [] }); onClose(); };
  const handleSubmitNote = (e) => { e.preventDefault(); if (!noteContent.trim()) return; onAddNote({ id: Date.now().toString(), content: noteContent.trim(), date: noteDate, createdAt: new Date().toISOString() }); onClose(); };
  
  if (!isOpen) return null;
  
  const modalBg = isDark ? '#1f2937' : '#ffffff';
  const inputBg = isDark ? '#111827' : '#ffffff';
  const inputBorder = isDark ? '#374151' : '#d1d5db';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#374151';
  const tabBg = isDark ? '#374151' : '#f3f4f6';
  const tabActiveBg = '#3b82f6';
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60]" onClick={onClose}>
      <div className="w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: modalBg }} onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${inputBorder}` }}><h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Add New</h2><button onClick={onClose} style={{ color: textSecondary }}><X className="w-5 h-5" /></button></div>
        <div className="p-4 pb-0">
          <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: tabBg }}>
            <button onClick={() => setActiveTab('task')} className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors" style={{ backgroundColor: activeTab === 'task' ? tabActiveBg : 'transparent', color: activeTab === 'task' ? 'white' : textSecondary }}>Task</button>
            <button onClick={() => setActiveTab('note')} className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors" style={{ backgroundColor: activeTab === 'note' ? tabActiveBg : 'transparent', color: activeTab === 'note' ? 'white' : textSecondary }}>Note</button>
          </div>
        </div>
        {activeTab === 'task' && (
          <form onSubmit={handleSubmitTask} className="p-4 space-y-4">
            <div><label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Task Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} placeholder="What do you want to accomplish?" autoFocus /></div>
            <div><label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Due Date</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} /></div>
            <div><label className="block text-sm font-medium mb-2" style={{ color: textSecondary }}>Tags</label><TagEditor selectedTags={selectedTags} onTagsChange={setSelectedTags} allTags={allTags} isDark={isDark} /></div>
            <button type="submit" className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium">Add Task</button>
          </form>
        )}
        {activeTab === 'note' && (
          <form onSubmit={handleSubmitNote} className="p-4 space-y-4">
            <div><label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Note</label><textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="What's on your mind?" rows={4} className="w-full px-3 py-2 rounded-lg resize-none" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} autoFocus /></div>
            <div><label className="block text-sm font-medium mb-1" style={{ color: textSecondary }}>Date</label><input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} className="w-full px-3 py-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }} /></div>
            <button type="submit" className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium">Add Note</button>
          </form>
        )}
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ milestones, onSelectMilestone, onCreateMilestone, isDark, currentHour }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const bgColor = isDark ? '#111827' : '#f9fafb';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textPrimary = isDark ? '#f3f4f6' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  
  const { gradient, darkText } = getTimeGradient(currentHour);
  const greeting = getGreeting(Math.floor(currentHour));
  
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
  
  const MilestoneCard = ({ milestone }) => {
    const status = getMilestoneStatus(milestone.startDate, milestone.endDate);
    const tasks = milestone.tasks || [];
    const allItems = tasks.flatMap(t => [t, ...(t.subtasks || [])]);
    const completedItems = allItems.filter(i => i.status === STATUS.COMPLETE).length;
    const isComplete = status === 'complete';
    
    return (
      <button
        onClick={() => onSelectMilestone(milestone.id)}
        className="w-full p-4 rounded-xl text-left transition-all active:scale-[0.98]"
        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isComplete && <span className="text-sm">✓</span>}
              <h3 className="font-semibold truncate" style={{ color: textPrimary }}>{milestone.title}</h3>
            </div>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>{formatDateRange(milestone.startDate, milestone.endDate)}</p>
            <p className="text-xs mt-1" style={{ color: textSecondary }}>
              {completedItems}/{allItems.length} items {isComplete ? 'completed' : 'done'}
            </p>
          </div>
          <CircularProgress completed={completedItems} total={allItems.length} isDark={isDark} />
        </div>
      </button>
    );
  };
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-6" style={{ background: gradient }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: darkText ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }}>{greeting}</p>
            <h1 className="text-2xl font-bold mt-0.5" style={{ color: darkText ? 'rgba(0,0,0,0.8)' : 'white' }}>Your Milestones</h1>
            <p className="text-sm mt-1" style={{ color: darkText ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }}>
              {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} · {activeMilestones.length} active
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-4 pb-24 space-y-6">
        {milestones.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
              <Calendar className="w-8 h-8" style={{ color: textSecondary }} />
            </div>
            <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>No milestones yet</h2>
            <p className="text-sm mt-1 mb-6" style={{ color: textSecondary }}>Create your first milestone to start tracking goals</p>
            <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium">Create Milestone</button>
          </div>
        ) : (
          <>
            {activeMilestones.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: textSecondary }}>Active</h2>
                <div className="space-y-3">
                  {activeMilestones.map(m => <MilestoneCard key={m.id} milestone={m} />)}
                </div>
              </div>
            )}
            
            {upcomingMilestones.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: textSecondary }}>Upcoming</h2>
                <div className="space-y-3">
                  {upcomingMilestones.map(m => <MilestoneCard key={m.id} milestone={m} />)}
                </div>
              </div>
            )}
            
            {completeMilestones.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: textSecondary }}>Completed</h2>
                <div className="space-y-3">
                  {completeMilestones.map(m => <MilestoneCard key={m.id} milestone={m} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* FAB */}
      <button onClick={() => setShowCreateModal(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center z-30">
        <Plus className="w-6 h-6" />
      </button>
      
      <CreateMilestoneModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={onCreateMilestone} isDark={isDark} />
    </div>
  );
}

// Milestone View Component (the existing task list view)
function MilestoneView({ milestone, onUpdateMilestone, onBack, isDark, currentHour }) {
  const [filterDate, setFilterDate] = useState(DATE_FILTERS.ALL);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState('task');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [notesTask, setNotesTask] = useState(null);
  const [savedSummary, setSavedSummary] = useState(() => localStorage.getItem(LOCAL_SUMMARY_PREFIX + milestone.id) || '');
  
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const taskListRef = useRef(null);
  
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
  
  useEffect(() => {
    if (allTags.length > 0 && selectedTags.length === 0) setSelectedTags([...allTags]);
    const newTags = allTags.filter(t => !selectedTags.includes(t));
    if (newTags.length > 0) setSelectedTags(prev => [...prev, ...newTags]);
  }, [allTags.join(',')]);
  
  const { gradient, darkText } = isMilestoneComplete ? getMilestoneCompleteGradient() : getTimeGradient(currentHour);
  const greeting = getGreeting(Math.floor(currentHour));
  const todayFormatted = formatToday();
  
  const handleUpdateTask = (updatedTask) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    onUpdateMilestone({ ...milestone, tasks: newTasks });
    if (notesTask && notesTask.id === updatedTask.id) setNotesTask(updatedTask);
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
  
  // Drag handlers
  const handleDragStart = useCallback((taskId) => { setDraggingId(taskId); if (navigator.vibrate) navigator.vibrate(50); }, []);
  
  const handleDragMove = useCallback((e) => {
    if (!draggingId || !taskListRef.current) return;
    if (e.cancelable) e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const taskElements = taskListRef.current.querySelectorAll('[data-task-id]');
    for (const el of taskElements) {
      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (clientY < midY) {
        const targetId = el.getAttribute('data-task-id');
        if (targetId !== draggingId) setDropTargetId(targetId);
        return;
      }
    }
    if (taskElements.length > 0) {
      const lastId = taskElements[taskElements.length - 1].getAttribute('data-task-id');
      if (lastId !== draggingId) setDropTargetId(lastId);
    }
  }, [draggingId]);
  
  const handleDragEnd = useCallback(() => {
    if (draggingId && dropTargetId && draggingId !== dropTargetId) {
      const newTasks = [...tasks];
      const dragIndex = newTasks.findIndex(t => t.id === draggingId);
      const dropIndex = newTasks.findIndex(t => t.id === dropTargetId);
      if (dragIndex !== -1 && dropIndex !== -1) {
        const [draggedTask] = newTasks.splice(dragIndex, 1);
        newTasks.splice(dropIndex, 0, draggedTask);
        onUpdateMilestone({ ...milestone, tasks: newTasks });
      }
    }
    setDraggingId(null);
    setDropTargetId(null);
  }, [draggingId, dropTargetId, tasks, milestone, onUpdateMilestone]);
  
  useEffect(() => {
    if (draggingId) {
      const handleMove = (e) => handleDragMove(e);
      const handleEnd = () => handleDragEnd();
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.body.style.overflow = '';
      };
    }
  }, [draggingId, handleDragMove, handleDragEnd]);
  
  let filteredTasks = tasks;
  if (filterDate === DATE_FILTERS.TODAY) filteredTasks = filteredTasks.filter(t => isToday(t.dueDate));
  if (selectedTags.length < allTags.length && selectedTags.length > 0) filteredTasks = filteredTasks.filter(t => (t.tags || []).some(tag => selectedTags.includes(tag)) || !(t.tags || []).length);
  
  const todayCount = tasks.filter(t => isToday(t.dueDate) && t.status !== STATUS.COMPLETE).length;
  const allItems = tasks.flatMap(t => [t, ...(t.subtasks || [])]);
  const completedItems = allItems.filter(i => i.status === STATUS.COMPLETE).length;
  const isTagFiltering = selectedTags.length < allTags.length && selectedTags.length > 0;
  
  const bgColor = isDark ? '#111827' : '#f9fafb';
  const filterBg = isDark ? '#1f2937' : '#f3f4f6';
  const filterActiveBg = isDark ? '#f3f4f6' : '#111827';
  const filterText = isDark ? '#d1d5db' : '#374151';
  const filterActiveText = isDark ? '#111827' : '#ffffff';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {showJournal && (
        <JournalView tasks={tasks} standaloneNotes={standaloneNotes} onUpdateTask={handleUpdateTask} onUpdateStandaloneNotes={handleUpdateStandaloneNotes} onClose={() => setShowJournal(false)} onOpenAddModal={() => handleOpenAddModal('note')} isDark={isDark} goal={goal} />
      )}
      
      <div className="px-4 pt-6 pb-6" style={{ background: gradient }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full" style={{ color: darkText ? 'rgba(0,0,0,0.7)' : 'white' }}>
              <Home className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                {isMilestoneComplete ? (
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>🎉 Milestone complete</p>
                ) : (
                  <p className="text-sm font-medium" style={{ color: darkText ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }}>{greeting}</p>
                )}
              </div>
              <h1 className="text-2xl font-bold mt-0.5" style={{ color: darkText ? 'rgba(0,0,0,0.8)' : 'white' }}>
                {isMilestoneComplete ? milestone.title : todayFormatted}
              </h1>
              <p className="text-sm mt-1" style={{ color: darkText ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }}>
                {isMilestoneComplete ? `${new Date(milestone.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${new Date(milestone.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})} · Finished!` : `${milestone.title} · ${new Date(milestone.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${new Date(milestone.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CircularCountdown daysLeft={daysLeft} totalDays={totalDays} darkText={darkText} isComplete={isMilestoneComplete} />
            <button onClick={() => setShowJournal(true)} className="relative" style={{ color: darkText ? 'rgba(0,0,0,0.7)' : 'white' }}>
              <BookOpen className="w-5 h-5" />
              {totalNotes > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center font-medium">{totalNotes > 9 ? '9+' : totalNotes}</span>}
            </button>
            <button onClick={() => setShowSettingsModal(true)} style={{ color: darkText ? 'rgba(0,0,0,0.7)' : 'white' }}><Settings className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium" style={{ color: darkText ? 'rgba(0,0,0,0.8)' : 'white' }}>{isMilestoneComplete ? 'Final Progress' : 'Overall Progress'}</span>
            <span style={{ color: darkText ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }}>{completedItems}/{allItems.length}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: darkText ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)' }}>
            <div className="h-full transition-all" style={{ width: `${allItems.length ? (completedItems / allItems.length) * 100 : 0}%`, backgroundColor: darkText ? 'rgba(0,0,0,0.7)' : 'white' }} />
          </div>
        </div>
      </div>
      
      {isMilestoneComplete && (
        <div className="px-4 mt-4">
          <MilestoneSummary tasks={tasks} standaloneNotes={standaloneNotes} goal={goal} isDark={isDark} savedSummary={savedSummary} onSaveSummary={handleSaveSummary} />
        </div>
      )}
      
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {isMilestoneComplete ? (
            <button onClick={() => setFilterDate(DATE_FILTERS.ALL)} className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap" style={{ backgroundColor: filterDate === DATE_FILTERS.ALL ? filterActiveBg : filterBg, color: filterDate === DATE_FILTERS.ALL ? filterActiveText : filterText }}>All Tasks</button>
          ) : (
            <>
              <button onClick={() => setFilterDate(DATE_FILTERS.ALL)} className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap" style={{ backgroundColor: filterDate === DATE_FILTERS.ALL ? filterActiveBg : filterBg, color: filterDate === DATE_FILTERS.ALL ? filterActiveText : filterText }}>All</button>
              <button onClick={() => setFilterDate(DATE_FILTERS.TODAY)} className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5" style={{ backgroundColor: filterDate === DATE_FILTERS.TODAY ? filterActiveBg : filterBg, color: filterDate === DATE_FILTERS.TODAY ? filterActiveText : filterText }}>Today{todayCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: filterDate === DATE_FILTERS.TODAY ? (isDark ? '#374151' : '#e5e7eb') : '#3b82f6', color: filterDate === DATE_FILTERS.TODAY ? filterText : 'white' }}>{todayCount}</span>}</button>
            </>
          )}
          <button onClick={() => setShowTagsModal(true)} className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5" style={{ backgroundColor: isTagFiltering ? filterActiveBg : filterBg, color: isTagFiltering ? filterActiveText : filterText }}><Tag className="w-3.5 h-3.5" />Tags{isTagFiltering && <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb', color: filterText }}>{selectedTags.length}</span>}</button>
        </div>
      </div>
      
      <div className="px-4 mt-4 pb-24 space-y-2" ref={taskListRef}>
        {filteredTasks.map(task => (
          <div key={task.id} data-task-id={task.id}>
            <TaskItem task={task} onUpdate={handleUpdateTask} allTags={allTags} isDark={isDark} onOpenNotes={setNotesTask} onDragStart={handleDragStart} isDragging={draggingId === task.id} isDropTarget={dropTargetId === task.id} isMilestoneComplete={isMilestoneComplete} />
          </div>
        ))}
        {!filteredTasks.length && <div className="text-center py-12" style={{ color: textSecondary }}>{filterDate !== DATE_FILTERS.ALL || isTagFiltering ? 'No tasks match filters' : 'No tasks yet'}</div>}
      </div>
      
      <button onClick={() => handleOpenAddModal('task')} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center z-30"><Plus className="w-6 h-6" /></button>
      
      <TagsModal isOpen={showTagsModal} onClose={() => setShowTagsModal(false)} allTags={allTags} selectedTags={selectedTags} onTagsChange={setSelectedTags} isDark={isDark} />
      <AddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} defaultTab={addModalDefaultTab} onAddTask={handleAddTask} onAddNote={handleAddNote} allTags={allTags} isDark={isDark} />
      <GoalSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} goal={goal} onSave={handleGoalSave} isDark={isDark} />
      <NotesModal isOpen={!!notesTask} onClose={() => setNotesTask(null)} task={notesTask} onUpdateTask={handleUpdateTask} isDark={isDark} />
    </div>
  );
}

export default function VacationTracker() {
  const [milestones, setMilestones] = useState([]);
  const [currentView, setCurrentView] = useState({ view: VIEWS.DASHBOARD });
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours() + new Date().getMinutes() / 60);
  
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const h = (e) => setIsDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  
  useEffect(() => {
    const i = setInterval(() => setCurrentHour(new Date().getHours() + new Date().getMinutes() / 60), 60000);
    return () => clearInterval(i);
  }, []);
  
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
        }
      } else {
        setCurrentView(parsed);
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
  
  const handleSelectMilestone = (milestoneId) => {
    setCurrentView({ view: VIEWS.MILESTONE, milestoneId });
  };
  
  const handleBackToDashboard = () => {
    setCurrentView({ view: VIEWS.DASHBOARD });
  };
  
  const handleCreateMilestone = (newMilestone) => {
    setMilestones([...milestones, newMilestone]);
    setCurrentView({ view: VIEWS.MILESTONE, milestoneId: newMilestone.id });
  };
  
  const handleUpdateMilestone = (updatedMilestone) => {
    setMilestones(milestones.map(m => m.id === updatedMilestone.id ? updatedMilestone : m));
  };
  
  const bgColor = isDark ? '#111827' : '#f9fafb';
  
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  
  // Render based on current view
  if (currentView.view === VIEWS.MILESTONE && currentView.milestoneId) {
    const milestone = milestones.find(m => m.id === currentView.milestoneId);
    if (milestone) {
      return (
        <MilestoneView
          milestone={milestone}
          onUpdateMilestone={handleUpdateMilestone}
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
      isDark={isDark}
      currentHour={currentHour}
    />
  );
}
