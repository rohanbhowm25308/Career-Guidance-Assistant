/* Animated holographic sphere — echoes the reference art: a rotating
   wireframe globe with orbiting nodes, rendered faint and slow behind
   the dashboard so it reads as ambient atmosphere, not a distraction. */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, DPR;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = window.innerWidth * DPR;
    H = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // Sphere sits anchored to the right side, like the reference image.
  const RINGS = 14;
  const POINTS_PER_RING = 26;
  let rotation = 0;

  const nodes = [];
  for (let i = 0; i < 46; i++) {
    nodes.push({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      r: 1,
      pulse: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.01,
    });
  }

  function project(x, y, z, cx, cy, radius, scale) {
    const persp = scale / (scale + z);
    return {
      x: cx + x * persp * radius,
      y: cy + y * persp * radius,
      s: persp,
    };
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.76;
    const cy = H * 0.42;
    const radius = Math.min(W, H) * 0.30;
    const scale = radius * 2.4;

    rotation += reduceMotion ? 0 : 0.0016;

    // Wireframe latitude/longitude rings
    ctx.lineWidth = 1 * DPR;
    for (let ring = 0; ring < RINGS; ring++) {
      const lat = (ring / (RINGS - 1)) * Math.PI - Math.PI / 2;
      ctx.beginPath();
      let first = true;
      for (let p = 0; p <= POINTS_PER_RING; p++) {
        const lon = (p / POINTS_PER_RING) * Math.PI * 2 + rotation;
        const x = Math.cos(lat) * Math.cos(lon);
        const y = Math.sin(lat);
        const z = Math.cos(lat) * Math.sin(lon);
        const pt = project(x, y, z, cx, cy, radius, scale);
        const alpha = 0.05 + Math.max(0, pt.s - 0.6) * 0.35;
        if (first) { ctx.moveTo(pt.x, pt.y); first = false; }
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = `rgba(139, 92, 246, ${0.10})`;
      ctx.stroke();
    }
    for (let ring = 0; ring < RINGS; ring++) {
      const lon0 = (ring / RINGS) * Math.PI * 2;
      ctx.beginPath();
      let first = true;
      for (let p = 0; p <= POINTS_PER_RING; p++) {
        const lat = (p / POINTS_PER_RING) * Math.PI - Math.PI / 2;
        const lon = lon0 + rotation;
        const x = Math.cos(lat) * Math.cos(lon);
        const y = Math.sin(lat);
        const z = Math.cos(lat) * Math.sin(lon);
        const pt = project(x, y, z, cx, cy, radius, scale);
        if (first) { ctx.moveTo(pt.x, pt.y); first = false; }
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = `rgba(34, 211, 238, 0.07)`;
      ctx.stroke();
    }

    // Outer glow rim
    const rim = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.15);
    rim.addColorStop(0, 'rgba(139,92,246,0.16)');
    rim.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting data nodes with connecting lines (network feel)
    const projected = [];
    nodes.forEach((n) => {
      const lon = n.theta + rotation * 1.4;
      const x = Math.sin(n.phi) * Math.cos(lon);
      const y = Math.cos(n.phi);
      const z = Math.sin(n.phi) * Math.sin(lon);
      const pt = project(x, y, z, cx, cy, radius * 1.02, scale);
      n.pulse += n.speed;
      projected.push({ ...pt, pulse: n.pulse });
    });

    ctx.lineWidth = 1 * DPR;
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const a = projected[i], b = projected[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 90 * DPR && a.s > 0.75 && b.s > 0.75) {
          ctx.strokeStyle = `rgba(232, 121, 249, ${0.06 * (1 - d / (90 * DPR))})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    projected.forEach((p) => {
      const glow = (Math.sin(p.pulse) + 1) / 2;
      const rad = (1.4 + glow * 1.6) * DPR * p.s;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.s > 0.9 ? '34,211,238' : '167,139,250'}, ${0.25 + glow * 0.5 * p.s})`;
      ctx.fill();
    });

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
