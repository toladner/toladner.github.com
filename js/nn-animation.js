// Easter Egg: Neural Network Set Propagation Animation
// Triggered by clicking the avatar image
(function () {
    'use strict';

    let clickTimes = [];
    let isActive = false;

    document.addEventListener('DOMContentLoaded', function () {
        const avatar = document.querySelector('.profile-image');
        if (!avatar) return;

        avatar.addEventListener('click', function () {
            const now = Date.now();
            clickTimes.push(now);
            // Keep only clicks within 2 seconds
            clickTimes = clickTimes.filter(t => now - t < 2000);
            if (clickTimes.length >= 1 && !isActive) {
                clickTimes = [];
                removeHint();
                launchAnimation();
            }
        });

        // Show hint after idle time
        const HINT_DELAY = 60 * 1000; // 1 minute
        let hintEl = null;
        let hintTimeout = setTimeout(showHint, HINT_DELAY);

        function showHint() {
            if (isActive || hintEl) return;
            hintEl = document.createElement('div');
            Object.assign(hintEl.style, {
                position: 'absolute',
                pointerEvents: 'none',
                opacity: '0',
                transition: 'opacity 0.6s ease',
                zIndex: '100',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '2px',
            });
            // Bent arrow curving upward toward avatar, base aligns with text
            // Uses currentColor/var(--bs-body-color) to match light/dark theme
            hintEl.style.color = 'var(--bs-body-color)';
            hintEl.innerHTML =
                '<svg width="30" height="32" viewBox="0 0 30 32" fill="none" style="flex-shrink:0;margin-bottom:-2px">' +
                '<path d="M8 2 C8 16, 14 26, 28 26" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
                '<path d="M4 6 L8 0 L12 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>' +
                '<span style="font:13px Inter,sans-serif;font-style:italic">click me</span>';
            // Position below the avatar, centered
            avatar.parentElement.style.position = 'relative';
            avatar.parentElement.appendChild(hintEl);
            const avatarRect = avatar.getBoundingClientRect();
            const parentRect = avatar.parentElement.getBoundingClientRect();
            const hintLeft = avatarRect.left - parentRect.left + avatarRect.width * 0.45;
            const hintTop = avatarRect.top - parentRect.top + avatarRect.height + 6;
            hintEl.style.left = hintLeft + 'px';
            hintEl.style.top = hintTop + 'px';
            requestAnimationFrame(() => { hintEl.style.opacity = '1'; });
        }

        function removeHint() {
            clearTimeout(hintTimeout);
            if (!hintEl) return;
            hintEl.style.opacity = '0';
            const el = hintEl;
            hintEl = null;
            setTimeout(() => el.remove(), 600);
        }
    });

    // --- Network architecture ---
    const LAYERS = [2, 5, 5, 2];

    // --- Zonotope geometry ---
    // Builds zonotope vertices from n generators via all sign combinations, then convex hull
    function makeZonotope(cx, cy, generators) {
        // generators: array of {x, y}
        const n = generators.length;
        const combos = 1 << n; // 2^n sign combinations
        const points = [];
        for (let mask = 0; mask < combos; mask++) {
            let sx = 0, sy = 0;
            for (let i = 0; i < n; i++) {
                const sign = (mask & (1 << i)) ? 1 : -1;
                sx += sign * generators[i].x;
                sy += sign * generators[i].y;
            }
            points.push({ x: cx + sx, y: cy + sy });
        }
        return convexHull(points);
    }

    // Graham scan convex hull
    function convexHull(points) {
        if (points.length <= 2) return points.slice();
        // Cross product of vectors OA and OB
        function cross(o, a, b) {
            return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        }
        // Sort by x, then y
        const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
        // Build lower hull
        const lower = [];
        for (const p of sorted) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
                lower.pop();
            lower.push(p);
        }
        // Build upper hull
        const upper = [];
        for (let i = sorted.length - 1; i >= 0; i--) {
            const p = sorted[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
                upper.pop();
            upper.push(p);
        }
        // Remove last point of each half because it's repeated
        lower.pop();
        upper.pop();
        return lower.concat(upper);
    }

    function drawPolygon(ctx, pts, fillStyle, strokeStyle, lineWidth, lineDash) {
        if (pts.length < 2) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        if (lineDash) ctx.setLineDash(lineDash);
        if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
        if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = lineWidth || 2; ctx.stroke(); }
        ctx.restore();
    }

    // --- Drawing helpers ---
    // Small axes in bottom-left corner (like reference image)
    function drawAxes(ctx, ox, oy, armLen, alpha, labels) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1.2;
        // Cross shape: both directions from origin
        const stub = armLen * 0.35; // short stub in negative direction
        // X axis
        ctx.beginPath(); ctx.moveTo(ox - stub, oy); ctx.lineTo(ox + armLen, oy); ctx.stroke();
        // Y axis
        ctx.beginPath(); ctx.moveTo(ox, oy + stub); ctx.lineTo(ox, oy - armLen); ctx.stroke();
        // Arrow tips
        const ar = 3.5;
        ctx.beginPath(); ctx.moveTo(ox + armLen, oy); ctx.lineTo(ox + armLen - ar, oy - ar); ctx.moveTo(ox + armLen, oy); ctx.lineTo(ox + armLen - ar, oy + ar); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, oy - armLen); ctx.lineTo(ox - ar, oy - armLen + ar); ctx.moveTo(ox, oy - armLen); ctx.lineTo(ox + ar, oy - armLen + ar); ctx.stroke();
        // Labels
        if (labels) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(labels[0], ox + armLen + 4, oy + 4);
            ctx.textAlign = 'center';
            ctx.fillText(labels[1], ox, oy - armLen - 6);
        }
        ctx.restore();
    }

    function drawNetwork(ctx, neurons, connections, progress, netLeft, netRight) {
        // progress: 0..1 sweep from left to right across the network
        // Map progress to an x-position with some blending width
        const span = netRight - netLeft;
        const frontX = netLeft + progress * span;
        const blendW = span * 0.18; // smooth fade zone width

        // Draw connections — highlight travels linearly along each wire
        for (const conn of connections) {
            const x0 = conn.from.x, y0 = conn.from.y;
            const x1 = conn.to.x, y1 = conn.to.y;

            // Always draw dim base connection
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.strokeStyle = 'rgba(156,163,175,0.15)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();

            // Linear progress along this connection: 0 when front at x0, 1 when front at x1
            if (frontX > x0) {
                const end = Math.min((frontX - x0) / (x1 - x0), 1);
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x0 + (x1 - x0) * end, y0 + (y1 - y0) * end);
                ctx.strokeStyle = 'rgba(74,144,226,0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            }
        }
        // Draw neurons — highlight snaps on when front reaches them
        for (const n of neurons) {
            const on = frontX >= n.x;
            const r = n.layer === 0 || n.layer === LAYERS.length - 1 ? 6 : 7;
            ctx.save();
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = on ? '#4a90e2' : '#374151';
            ctx.fill();
            ctx.strokeStyle = on ? '#6ba8f0' : '#6b7280';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
    }

    // --- Main animation ---
    function launchAnimation() {
        isActive = true;

        // Create overlay
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, opacity: 0, transition: 'opacity 0.4s ease',
            backgroundColor: 'rgba(17,24,39,0.92)', cursor: 'pointer',
        });
        document.body.appendChild(overlay);

        // Create canvas
        const canvas = document.createElement('canvas');
        overlay.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // Sizing
        function resize() {
            const dpr = window.devicePixelRatio || 1;
            const w = Math.min(window.innerWidth * 0.92, 800);
            const h = Math.min(window.innerHeight * 0.55, 400);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return { w, h, dpr };
        }

        let dims = resize();
        const onResize = () => { dims = resize(); };
        window.addEventListener('resize', onResize);

        // Layout computation
        function layout(w, h) {
            const inputCx = w * 0.14;
            const inputCy = h * 0.5;
            const outputCx = w * 0.86;
            const outputCy = h * 0.5;
            const netLeft = w * 0.30;
            const netRight = w * 0.70;
            const netCy = h * 0.5;
            const netH = h * 0.7;

            // Neuron positions
            const neurons = [];
            const connections = [];
            for (let l = 0; l < LAYERS.length; l++) {
                const count = LAYERS[l];
                const x = netLeft + (netRight - netLeft) * l / (LAYERS.length - 1);
                for (let i = 0; i < count; i++) {
                    const y = netCy - netH / 2 + netH * (i + 0.5) / count;
                    neurons.push({ x, y, layer: l, index: i });
                }
            }
            // Connections between adjacent layers
            for (const n of neurons) {
                if (n.layer === 0) continue;
                for (const m of neurons) {
                    if (m.layer === n.layer - 1) {
                        connections.push({ from: m, to: n });
                    }
                }
            }

            // Zonotope sizes scale with canvas
            const zScale = Math.min(w, h) / 800 * 55;

            // Offset sets from axes origin (upper-right quadrant)
            const inputSetCx = inputCx + zScale * 0.3;
            const inputSetCy = inputCy - zScale * 0.25;
            const outputSetCx = outputCx + zScale * 0.35;
            const outputSetCy = outputCy - zScale * 0.3;

            // Small axes in bottom-left corner of each space
            const axisArm = 18;
            const inputAxX = inputCx - zScale * 1.2;
            const inputAxY = inputCy + zScale * 1.2;
            const outputAxX = outputCx - zScale * 1.2;
            const outputAxY = outputCy + zScale * 1.2;

            return { inputCx, inputCy, outputCx, outputCy, netLeft, netRight, netCy, neurons, connections, zScale, inputSetCx, inputSetCy, outputSetCx, outputSetCy, axisArm, inputAxX, inputAxY, outputAxX, outputAxY };
        }

        // Animation params
        const DURATION = 6500; // ms
        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / DURATION, 1);
            const { w, h } = dims;
            const L = layout(w, h);

            ctx.clearRect(0, 0, w, h);

            // --- Phase calculations ---
            const fadeIn = smoothstep(0, 0.06, t);
            const inputAppear = smoothstep(0.06, 0.12, t);
            const inputMove = smoothstep(0.12, 0.28, t);
            const layerProg = smoothstep(0.28, 0.56, t); // 0..1 across layers
            const outputEmerge = smoothstep(0.56, 0.68, t);
            const outputMove = smoothstep(0.58, 0.72, t);
            const specAppear = smoothstep(0.72, 0.78, t);
            const verifiedAppear = smoothstep(0.80, 0.88, t);
            const closeHint = smoothstep(0.92, 1.0, t);

            ctx.save();
            ctx.globalAlpha = fadeIn;

            // --- Labels ---
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Input Space', L.inputCx, h * 0.10);
            ctx.fillText('Neural Network', (L.netLeft + L.netRight) / 2, h * 0.10);
            ctx.fillText('Output Space', L.outputCx, h * 0.10);

            // Input axes (small, bottom-left corner)
            drawAxes(ctx, L.inputAxX, L.inputAxY, L.axisArm, 1, ['x₍₁₎', 'x₍₂₎']);

            // Network
            const netProgress = inputMove >= 1 ? layerProg : -1;
            drawNetwork(ctx, L.neurons, L.connections, netProgress, L.netLeft, L.netRight);

            // --- Input zonotope ---
            if (inputAppear > 0) {
                const inputZono = makeZonotope(0, 0, [
                    { x: L.zScale * 0.65, y: L.zScale * 0.18 },
                    { x: L.zScale * 0.12, y: L.zScale * 0.55 },
                ]);

                if (inputMove < 1) {
                    // Zonotope at input space (offset from origin), then moving toward network
                    const moveT = inputMove;
                    const cx = lerp(L.inputSetCx, L.netLeft - 5, moveT);
                    const cy = lerp(L.inputSetCy, L.inputCy, moveT);
                    const scale = lerp(1, 0.3, moveT);
                    const angle = moveT * Math.PI * 0.35; // slight spin as it enters
                    const alpha = inputAppear * lerp(1, 0, smoothstep(0.7, 1, moveT));

                    const pts = inputZono.map(p => {
                        const rx = p.x * Math.cos(angle) - p.y * Math.sin(angle);
                        const ry = p.x * Math.sin(angle) + p.y * Math.cos(angle);
                        return { x: cx + rx * scale, y: cy + ry * scale };
                    });
                    drawPolygon(ctx, pts, `rgba(74,144,226,${0.18 * alpha})`, `rgba(74,144,226,${0.8 * alpha})`, 2);
                }
            }

            // --- Output zonotope ---
            if (outputEmerge > 0) {
                // Slightly different shape (transformed by the network, 3 generators)
                const oScale = L.zScale * 0.75;
                const outputZono = makeZonotope(0, 0, [
                    { x: oScale * 0.55, y: oScale * 0.2 },
                    { x: oScale * 0.15, y: oScale * 0.6 },
                    { x: oScale * -0.35, y: oScale * 0.3 },
                ]);

                const cx = lerp(L.netRight + 5, L.outputSetCx, outputMove);
                const cy = lerp(L.outputCy, L.outputSetCy, outputMove);
                const scale = lerp(0.3, 1, outputEmerge);
                const angle = (1 - outputMove) * Math.PI * -0.3; // spin settles as it arrives
                const alpha = outputEmerge;

                // Color transitions to green when verified
                const blue = [74, 144, 226];
                const green = [34, 197, 94];
                const col = lerpColor(blue, green, verifiedAppear);
                const colStr = `${col[0]},${col[1]},${col[2]}`;

                const pts = outputZono.map(p => {
                    const rx = p.x * Math.cos(angle) - p.y * Math.sin(angle);
                    const ry = p.x * Math.sin(angle) + p.y * Math.cos(angle);
                    return { x: cx + rx * scale, y: cy + ry * scale };
                });
                drawPolygon(ctx, pts, `rgba(${colStr},${0.2 * alpha})`, `rgba(${colStr},${0.85 * alpha})`, 2);

                // Output axes (small, bottom-left corner)
                if (outputMove > 0) {
                    drawAxes(ctx, L.outputAxX, L.outputAxY, L.axisArm, outputMove, ['y₍₁₎', 'y₍₂₎']);
                }

                // Specification box (centered on the offset output set, comfortably larger)
                if (specAppear > 0) {
                    const boxPad = oScale * 1.45;
                    const boxPts = [
                        { x: L.outputSetCx - boxPad, y: L.outputSetCy - boxPad * 0.95 },
                        { x: L.outputSetCx + boxPad, y: L.outputSetCy - boxPad * 0.95 },
                        { x: L.outputSetCx + boxPad, y: L.outputSetCy + boxPad * 0.95 },
                        { x: L.outputSetCx - boxPad, y: L.outputSetCy + boxPad * 0.95 },
                    ];
                    drawPolygon(ctx, boxPts, null, `rgba(34,197,94,${0.7 * specAppear})`, 2, [6, 4]);

                    // Spec label
                    ctx.save();
                    ctx.globalAlpha = specAppear * 0.7;
                    ctx.fillStyle = '#22c55e';
                    ctx.font = '10px Inter, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('spec', L.outputSetCx + boxPad, L.outputSetCy - boxPad * 0.95 - 4);
                    ctx.restore();
                }

                // Verified badge (centered under output space)
                if (verifiedAppear > 0) {
                    const badgeCx = L.outputCx;
                    const badgeY = L.outputCy + L.zScale * 2.5;
                    const badgeScale = verifiedAppear;
                    // Layout: [circle] [gap] [text], centered on badgeCx
                    const cr = 11 * badgeScale;
                    const gap = 5;
                    const fontSize = Math.round(14 * badgeScale);
                    const textWidth = 52 * badgeScale; // approx width of "Verified!"
                    const totalWidth = cr * 2 + gap + textWidth;
                    const left = badgeCx - totalWidth / 2;
                    const circleCx = left + cr;
                    const textX = left + cr * 2 + gap;

                    ctx.save();
                    ctx.globalAlpha = verifiedAppear;

                    // Checkmark circle
                    ctx.beginPath();
                    ctx.arc(circleCx, badgeY, cr, 0, Math.PI * 2);
                    ctx.fillStyle = '#22c55e';
                    ctx.fill();

                    // Checkmark
                    ctx.beginPath();
                    ctx.moveTo(circleCx - 5, badgeY);
                    ctx.lineTo(circleCx - 1, badgeY + 4);
                    ctx.lineTo(circleCx + 6, badgeY - 4);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();

                    // Text
                    ctx.fillStyle = '#22c55e';
                    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Verified!', textX, badgeY);

                    ctx.restore();
                }
            }

            // Close hint
            if (closeHint > 0) {
                ctx.save();
                ctx.globalAlpha = closeHint * 0.5;
                ctx.fillStyle = '#9ca3af';
                ctx.font = '12px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Click anywhere to close', w / 2, h - 10);
                ctx.restore();
            }

            ctx.restore();

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                // Loop the glow subtly or just hold
                requestAnimationFrame(animate);
            }
        }

        // Fade in overlay
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            requestAnimationFrame(animate);
        });

        // Dismiss
        overlay.addEventListener('click', function () {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                window.removeEventListener('resize', onResize);
                isActive = false;
            }, 400);
        });
    }

    // --- Utilities ---
    function smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function lerpColor(c1, c2, t) {
        return [
            Math.round(lerp(c1[0], c2[0], t)),
            Math.round(lerp(c1[1], c2[1], t)),
            Math.round(lerp(c1[2], c2[2], t)),
        ];
    }
})();
