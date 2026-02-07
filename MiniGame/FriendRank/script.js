/**
 * 朋友排行榜
 * 流程：選人數 -> 抽題 -> 玩家輪流輸入數字 -> 選擇放到排行榜空位 -> 全部完成後揭曉並計分
 */

const $ = (id) => document.getElementById(id);

const setupEl = $('setup');
const gameEl = $('game');
const playerCountEl = $('playerCount');
const startBtn = $('startBtn');
const questionTextEl = $('questionText');
const currentPlayerEl = $('currentPlayer');
const answerInputEl = $('answerInput');
const confirmAnswerBtn = $('confirmAnswerBtn');
const placeAreaEl = $('placeArea');
const placeTitleEl = $('placeTitle');
const slotsEl = $('slots');
const resultEl = $('result');
const restartBtn = $('restartBtn');
const redrawBtn = $('redrawBtn');

/** @type {{count:number, question:string, players:Array<{id:number,label:string,answer:number|null,placedAt:number|null}>, slots:(number|null)[], current:number, phase:'setup'|'answer'|'place'|'reveal'} */
let state = null;

function clampInt(value, min, max) {
	const n = Number.parseInt(String(value), 10);
	if (!Number.isFinite(n)) return null;
	return Math.max(min, Math.min(max, n));
}

function pickRandomQuestion() {
	const bank = (typeof questionBank !== 'undefined' ? questionBank : window.questionBank);
	if (!Array.isArray(bank) || bank.length === 0) {
		return '（題庫是空的，請先在 questions.js 加入題目）';
	}
	const idx = Math.floor(Math.random() * bank.length);
	return bank[idx];
}

function resetUIForNewTurn() {
	answerInputEl.value = '';
	answerInputEl.disabled = false;
	confirmAnswerBtn.disabled = false;
	placeAreaEl.classList.add('hidden');
	if (placeTitleEl) placeTitleEl.textContent = '選擇你要放的位置（點空格）';
	resultEl.classList.add('hidden');
	resultEl.innerHTML = '';
}

function startGame() {
	const count = clampInt(playerCountEl.value, 2, 10);
	if (count == null) {
		alert('請輸入正確的玩家數量（2～10）。');
		return;
	}

	state = {
		count,
		question: pickRandomQuestion(),
		players: Array.from({ length: count }, (_, i) => ({
			id: i,
			label: `玩家 ${i + 1}`,
			answer: null,
			placedAt: null,
		})),
		slots: Array.from({ length: count }, () => null),
		current: 0,
		phase: 'answer',
	};

	setupEl.classList.add('hidden');
	gameEl.classList.remove('hidden');

	questionTextEl.textContent = state.question;
	render();
	resetUIForNewTurn();
	answerInputEl.focus();
}

function redrawQuestion() {
	const count = state?.count ?? clampInt(playerCountEl.value, 2, 10);
	if (count == null) {
		alert('請輸入正確的玩家數量（2～10）。');
		return;
	}

	state = {
		count,
		question: pickRandomQuestion(),
		players: Array.from({ length: count }, (_, i) => ({
			id: i,
			label: `玩家 ${i + 1}`,
			answer: null,
			placedAt: null,
		})),
		slots: Array.from({ length: count }, () => null),
		current: 0,
		phase: 'answer',
	};

	setupEl.classList.add('hidden');
	gameEl.classList.remove('hidden');

	questionTextEl.textContent = state.question;
	resetUIForNewTurn();
	render();
	answerInputEl.focus();
}

function render() {
	if (!state) return;

	const currentPlayer = state.players[state.current];
	currentPlayerEl.textContent = currentPlayer ? currentPlayer.label : '—';
	renderSlots();
}

function renderSlots({ reveal = false } = {}) {
	if (!state) return;
	slotsEl.innerHTML = '';

	for (let i = 0; i < state.count; i++) {
		const occupantPlayerId = state.slots[i];
		const slot = document.createElement('div');
		slot.className = 'slot' + (occupantPlayerId != null ? ' occupied' : '');

		const pos = document.createElement('span');
		pos.className = 'pos';
		pos.textContent = `第 ${i + 1} 名`;

		const who = document.createElement('span');
		who.className = 'who';

		const ans = document.createElement('span');
		ans.className = 'ans';

		const meta = document.createElement('div');
		meta.className = 'meta';

		if (occupantPlayerId == null) {
			who.textContent = '（空）';
			ans.textContent = '';
			if (state.phase === 'place') {
				slot.classList.add('clickable');
				slot.setAttribute('role', 'button');
				slot.tabIndex = 0;
				slot.addEventListener('click', () => placeCurrentPlayerAt(i));
				slot.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' || e.key === ' ') placeCurrentPlayerAt(i);
				});
			}
		} else {
			const p = state.players[occupantPlayerId];
			who.textContent = p?.label ?? '（未知）';
			if (reveal) {
				ans.textContent = `答案：${p.answer}`;
			} else {
				ans.textContent = '答案：??';
			}
		}

		meta.appendChild(pos);
		meta.appendChild(who);
		meta.appendChild(ans);
		slot.appendChild(meta);

		if (occupantPlayerId != null && !reveal) {
			const actions = document.createElement('div');
			actions.className = 'actions';

			const up = document.createElement('button');
			up.type = 'button';
			up.className = 'slot-btn';
			up.textContent = '上移';
			up.disabled = state.phase !== 'place' || i <= 0;
			up.addEventListener('click', (e) => {
				e.stopPropagation();
				moveAtIndex(i, -1);
			});

			const down = document.createElement('button');
			down.type = 'button';
			down.className = 'slot-btn';
			down.textContent = '下移';
			down.disabled = state.phase !== 'place' || i >= state.count - 1;
			down.addEventListener('click', (e) => {
				e.stopPropagation();
				moveAtIndex(i, 1);
			});

			actions.appendChild(up);
			actions.appendChild(down);
			slot.appendChild(actions);
		}

		slotsEl.appendChild(slot);
	}
}

function swapSlots(a, b) {
	const tmp = state.slots[a];
	state.slots[a] = state.slots[b];
	state.slots[b] = tmp;

	const pa = state.slots[a];
	const pb = state.slots[b];
	if (pa != null) state.players[pa].placedAt = a;
	if (pb != null) state.players[pb].placedAt = b;
}

function moveAtIndex(from, delta) {
	if (!state) return;
	if (state.phase !== 'place') return;
	const to = from + delta;
	if (to < 0 || to >= state.count) return;
	swapSlots(from, to);
	renderSlots();
}

function confirmAnswer() {
	if (!state) return;
	if (state.phase !== 'answer') return;

	const raw = answerInputEl.value;
	const value = Number(raw);
	if (!Number.isFinite(value)) {
		alert('請輸入有效的數字。');
		return;
	}

	const currentPlayer = state.players[state.current];
	currentPlayer.answer = value;

	state.phase = 'place';
	answerInputEl.disabled = true;
	confirmAnswerBtn.disabled = true;
	placeAreaEl.classList.remove('hidden');
	if (placeTitleEl) placeTitleEl.textContent = '選擇你要放的位置（點空格）';
	renderSlots();
}

function placeCurrentPlayerAt(slotIndex) {
	if (!state) return;
	if (state.phase !== 'place') return;
	if (state.slots[slotIndex] != null) return;

	const currentPlayer = state.players[state.current];
	if (currentPlayer.answer == null) {
		alert('請先確認你的數字。');
		return;
	}

	state.slots[slotIndex] = currentPlayer.id;
	currentPlayer.placedAt = slotIndex;

	// 下一位
	state.current += 1;
	if (state.current >= state.count) {
		revealAndScore();
		return;
	}

	state.phase = 'answer';
	resetUIForNewTurn();
	render();
	answerInputEl.focus();
}

function computeViolationsInDescending(answersInOrder) {
	// 由上到下應該是大到小：answer[i] >= answer[i+1]
	let violations = 0;
	for (let i = 0; i < answersInOrder.length - 1; i++) {
		if (answersInOrder[i] < answersInOrder[i + 1]) violations += 1;
	}
	return violations;
}

function renderStars(score) {
	const filled = '★'.repeat(score);
	const empty = '☆'.repeat(5 - score);
	return filled + empty;
}

function revealAndScore() {
	state.phase = 'reveal';
	placeAreaEl.classList.remove('hidden');
	if (placeTitleEl) placeTitleEl.textContent = '排行榜揭曉';

	const answersInOrder = state.slots.map((playerId) => {
		const p = state.players[playerId];
		return p?.answer;
	});

	// 基本保護：正常情況不會有 null
	if (answersInOrder.some((v) => v == null || !Number.isFinite(v))) {
		resultEl.classList.remove('hidden');
		resultEl.innerHTML = '資料不完整，無法計分。請重新開始。';
		renderSlots({ reveal: true });
		return;
	}

	const violations = computeViolationsInDescending(answersInOrder);
	const score = Math.max(0, 5 - violations);

	renderSlots({ reveal: true });

	const title = violations === 0
		? '完美排序！'
		: `扣分：${violations} 處不是由大到小`;

	resultEl.classList.remove('hidden');
	resultEl.innerHTML = `
		<div class="stars" aria-label="得分 ${score} / 5">${renderStars(score)}</div>
		<div class="sub">${title}（${score} / 5）</div>
	`;

	currentPlayerEl.textContent = '—（已揭曉）';
	answerInputEl.disabled = true;
	confirmAnswerBtn.disabled = true;
}

function restart() {
	state = null;
	gameEl.classList.add('hidden');
	setupEl.classList.remove('hidden');
	answerInputEl.value = '';
	resultEl.classList.add('hidden');
	resultEl.innerHTML = '';
}

startBtn.addEventListener('click', startGame);
confirmAnswerBtn.addEventListener('click', confirmAnswer);
restartBtn.addEventListener('click', restart);

if (redrawBtn) {
	redrawBtn.addEventListener('click', redrawQuestion);
}

answerInputEl.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') confirmAnswer();
});
