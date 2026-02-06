
(() => {
	const canvas = document.getElementById("wheelCanvas");
	const drawBtn = document.getElementById("drawBtn");
	const resultEl = document.getElementById("result");

	if (!canvas || !drawBtn || !resultEl) return;
	if (!Array.isArray(window.questionBank) || window.questionBank.length === 0) {
		resultEl.textContent = "請先在 question.js 的 questionBank 填入店家";
		drawBtn.disabled = true;
		return;
	}

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const items = window.questionBank.slice();

	let logicalWidth = canvas.clientWidth || canvas.width;
	let logicalHeight = canvas.clientHeight || canvas.height;

	function resizeCanvasToDisplaySize() {
		const rect = canvas.getBoundingClientRect();
		const cssWidth = Math.max(1, Math.round(rect.width));
		const cssHeight = Math.max(1, Math.round(rect.height));
		const dpr = Math.max(1, window.devicePixelRatio || 1);

		const desiredWidth = Math.max(1, Math.round(cssWidth * dpr));
		const desiredHeight = Math.max(1, Math.round(cssHeight * dpr));

		logicalWidth = cssWidth;
		logicalHeight = cssHeight;

		if (canvas.width !== desiredWidth || canvas.height !== desiredHeight) {
			canvas.width = desiredWidth;
			canvas.height = desiredHeight;
		}

		// Draw using CSS pixels as units.
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	let rotation = 0; // radians
	let angularVelocity = 0; // radians/frame
	let spinning = false;
	let animationFrameId = null;

	function normalizeAngle(angle) {
		const twoPi = Math.PI * 2;
		return ((angle % twoPi) + twoPi) % twoPi;
	}

	function getSegmentIndexAtPointer() {
		const arc = (Math.PI * 2) / items.length;
		const pointerCanvasAngle = -Math.PI / 2; // 12 o'clock
		const localAngle = normalizeAngle(pointerCanvasAngle - rotation);
		const index = Math.floor(localAngle / arc);
		return Math.min(Math.max(index, 0), items.length - 1);
	}

	function segmentColor(i) {
		// Simple alternating, readable palette.
		const palette = ["#fde68a", "#bfdbfe", "#bbf7d0", "#fecaca", "#e9d5ff", "#fed7aa"];
		return palette[i % palette.length];
	}

	function drawWheel() {
		resizeCanvasToDisplaySize();

		const w = logicalWidth;
		const h = logicalHeight;
		const cx = w / 2;
		const cy = h / 2;
		const radius = Math.min(cx, cy) - 8;

		ctx.clearRect(0, 0, w, h);

		// Outer ring
		ctx.beginPath();
		ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
		ctx.fillStyle = "#ffffff";
		ctx.fill();

		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate(rotation);

		const arc = (Math.PI * 2) / items.length;
		for (let i = 0; i < items.length; i++) {
			const start = i * arc;
			const end = start + arc;

			// Slice
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.arc(0, 0, radius, start, end);
			ctx.closePath();
			ctx.fillStyle = segmentColor(i);
			ctx.fill();
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 2;
			ctx.stroke();

			// Text
			const text = String(items[i] ?? "");
			const mid = (start + end) / 2;

			ctx.save();
			ctx.rotate(mid);
			ctx.translate(radius * 0.62, 0);
			ctx.rotate(Math.PI / 2);
			ctx.fillStyle = "#111827";
			ctx.font = "700 14px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			// Prevent overflow: basic truncation
			let displayText = text;
			if (displayText.length > 10) displayText = displayText.slice(0, 9) + "…";
			ctx.fillText(displayText, 0, 0);
			ctx.restore();
		}

		ctx.restore();

		// Center cap
		ctx.beginPath();
		ctx.arc(cx, cy, 14, 0, Math.PI * 2);
		ctx.fillStyle = "#111827";
		ctx.fill();
	}

	function stopSpin() {
		spinning = false;
		angularVelocity = 0;
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		drawBtn.disabled = false;

		const index = getSegmentIndexAtPointer();
		const chosen = items[index];
		resultEl.textContent = `轉到：${chosen}`;
	}

	function tick() {
		// Advance
		rotation += angularVelocity;
		rotation = normalizeAngle(rotation);

		// Friction (ease out)
		angularVelocity *= 0.96;

		drawWheel();

		if (angularVelocity < 0.002) {
			stopSpin();
			return;
		}

		animationFrameId = requestAnimationFrame(tick);
	}

	drawBtn.addEventListener("click", () => {
		if (spinning) return;
		if (items.length < 2) {
			resultEl.textContent = "至少需要 2 間店家才能轉動";
			return;
		}

		spinning = true;
		drawBtn.disabled = true;
		resultEl.textContent = "轉動中…";

		// Random initial speed
		const min = 0.35;
		const max = 0.55;
		angularVelocity = min + Math.random() * (max - min);

		if (animationFrameId) cancelAnimationFrame(animationFrameId);
		animationFrameId = requestAnimationFrame(tick);
	});

	// Initial render
	window.addEventListener("resize", () => {
		if (spinning) return;
		drawWheel();
	});

	drawWheel();
})();
