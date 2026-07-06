const CELEBRATE_STYLE_ID = 'celebrate-style';
const FIREWORKS_STYLE_ID = 'fireworks-style';

const CONFETTI_COLORS = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4a90d9', '#ff9f43', '#a685e2'];

function ensureCelebrateStyle(): void {
  if (document.getElementById(CELEBRATE_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = CELEBRATE_STYLE_ID;
  style.textContent = `
    .celebrate-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1000;
      overflow: hidden;
    }

    .celebrate-piece {
      position: absolute;
      top: -20px;
      width: 14px;
      height: 14px;
      border-radius: 3px;
      opacity: 0.9;
      animation: celebrate-fall linear forwards;
    }

    @keyframes celebrate-fall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(110vh) rotate(540deg);
        opacity: 0.8;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * 画面全体に紙吹雪アニメーションを表示する。数秒後に自動で消える。
 */
export function playConfetti(pieceCount = 60, durationMs = 2000): void {
  ensureCelebrateStyle();

  const overlay = document.createElement('div');
  overlay.className = 'celebrate-overlay';

  for (let i = 0; i < pieceCount; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'celebrate-piece';
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const fallDuration = durationMs / 1000 + Math.random() * 0.8;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.left = `${left}vw`;
    piece.style.backgroundColor = color;
    piece.style.animationDelay = `${delay}s`;
    piece.style.animationDuration = `${fallDuration}s`;
    overlay.appendChild(piece);
  }

  document.body.appendChild(overlay);

  window.setTimeout(() => {
    overlay.remove();
  }, durationMs + 1200);
}

function ensureFireworksStyle(): void {
  if (document.getElementById(FIREWORKS_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = FIREWORKS_STYLE_ID;
  style.textContent = `
    .fireworks-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1000;
      overflow: hidden;
      background: radial-gradient(circle at center, rgba(20, 20, 60, 0.2), rgba(10, 10, 40, 0.55));
    }

    .fireworks-burst {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .fireworks-spark {
      position: absolute;
      top: 0;
      left: 0;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      animation: fireworks-spark-move ease-out forwards;
    }

    @keyframes fireworks-spark-move {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(var(--dx), var(--dy)) scale(0.3);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * 終点クリア時の全画面花火アニメーション。数秒間、複数箇所で花火が打ち上がる。
 */
export function playFireworks(durationMs = 3200): void {
  ensureFireworksStyle();

  const overlay = document.createElement('div');
  overlay.className = 'fireworks-overlay';
  document.body.appendChild(overlay);

  function spawnBurst(): void {
    const cx = 10 + Math.random() * 80;
    const cy = 15 + Math.random() * 50;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const sparkCount = 20;

    for (let i = 0; i < sparkCount; i += 1) {
      const spark = document.createElement('div');
      spark.className = 'fireworks-spark';
      const angle = (Math.PI * 2 * i) / sparkCount;
      const radius = 60 + Math.random() * 60;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      spark.style.left = `${cx}vw`;
      spark.style.top = `${cy}vh`;
      spark.style.backgroundColor = color;
      spark.style.setProperty('--dx', `${dx}px`);
      spark.style.setProperty('--dy', `${dy}px`);
      spark.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;
      overlay.appendChild(spark);

      window.setTimeout(() => spark.remove(), 1400);
    }
  }

  const interval = window.setInterval(spawnBurst, 450);
  spawnBurst();

  window.setTimeout(() => {
    window.clearInterval(interval);
    overlay.remove();
  }, durationMs);
}
