// Visual enhancements from feature/task-notes branch (stashed)
// These can be integrated into the main codebase later

// =============================================================================
// IMMERSIVE GRADIENT SYSTEM
// Time-based colors inspired by Japanese traditional palettes
// =============================================================================

// Updated getTimeGradient that returns color arrays instead of gradient strings
function getTimeGradient(hour) {
  const h = ((hour % 24) + 24) % 24;

  // NIGHT (9pm - 5am): Deep indigo/violet
  if (h >= 21 || h < 5) {
    return {
      colors: ['#1e1b4b', '#312e81', '#4c1d95', '#581c87'],
      darkText: false
    };
  }

  // DAWN (5am - 6:30am): Deep blue to purple
  if (h >= 5 && h < 6.5) {
    return {
      colors: ['#312e81', '#4338ca', '#6366f1', '#818cf8'],
      darkText: false
    };
  }

  // SUNRISE (6:30am - 8am): Coral/pink
  if (h >= 6.5 && h < 8) {
    return {
      colors: ['#fda4af', '#fb7185', '#f472b6', '#e879f9'],
      darkText: false
    };
  }

  // MORNING (8am - 11am): Golden amber
  if (h >= 8 && h < 11) {
    return {
      colors: ['#fef08a', '#fde047', '#facc15', '#f59e0b'],
      darkText: true
    };
  }

  // MIDDAY (11am - 4pm): Warm cream/yellow
  if (h >= 11 && h < 16) {
    return {
      colors: ['#fefce8', '#fef9c3', '#fef08a', '#fde047'],
      darkText: true
    };
  }

  // LATE AFTERNOON (4pm - 6pm): Deep orange
  if (h >= 16 && h < 18) {
    return {
      colors: ['#fed7aa', '#fdba74', '#fb923c', '#f97316'],
      darkText: false
    };
  }

  // SUNSET (6pm - 8pm): Pink/magenta
  if (h >= 18 && h < 20) {
    return {
      colors: ['#f9a8d4', '#f472b6', '#ec4899', '#db2777'],
      darkText: false
    };
  }

  // DUSK (8pm - 9pm): Purple to indigo
  return {
    colors: ['#c084fc', '#a855f7', '#8b5cf6', '#7c3aed'],
    darkText: false
  };
}

// =============================================================================
// IMMERSIVE ANIMATED BACKGROUND COMPONENT
// Full-screen gradient with subtle movement and film grain
// =============================================================================

function ImmersiveBackground({ colors }) {
  return (
    <div className="fixed inset-0" style={{ zIndex: 0 }}>
      {/* Animated gradient mesh */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)
          `,
        }}
      />

      {/* Animated gradient orbs for subtle movement */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 10%, ${colors[1]}88 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 80% 30%, ${colors[2]}66 0%, transparent 50%),
            radial-gradient(ellipse 70% 60% at 50% 80%, ${colors[3] || colors[2]}55 0%, transparent 50%)
          `,
          animation: 'gradientShift 30s ease-in-out infinite'
        }}
      />

      {/* Secondary movement layer */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 70% 20%, ${colors[0]}44 0%, transparent 40%),
            radial-gradient(ellipse 60% 50% at 30% 70%, ${colors[1]}33 0%, transparent 40%)
          `,
          animation: 'gradientShift2 25s ease-in-out infinite'
        }}
      />

      {/* Film grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.07,
          mixBlendMode: 'overlay'
        }}
      />

      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(2%, 1%) scale(1.02);
          }
          50% {
            transform: translate(-1%, 2%) scale(1.01);
          }
          75% {
            transform: translate(1%, -1%) scale(1.03);
          }
        }
        @keyframes gradientShift2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-2%, 2%) scale(1.04);
          }
          66% {
            transform: translate(2%, -1%) scale(0.98);
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================
//
// In your main component:
//
// const { colors, darkText } = getTimeGradient(currentHour);
//
// return (
//   <div className="min-h-screen relative overflow-hidden">
//     <ImmersiveBackground colors={colors} />
//     <div className="relative z-10">
//       {/* Your content here */}
//     </div>
//   </div>
// );
