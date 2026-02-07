(() => {
	/** @typedef {"setup"|"question"|"roles"|"nightReady"|"nightTimer"|"guess"} GameState */
	/** @typedef {{term: string, explanation: string}} Question */

	const panels = {
		setup: document.getElementById("panel-setup"),
		question: document.getElementById("panel-question"),
		roles: document.getElementById("panel-roles"),
		nightReady: document.getElementById("panel-nightReady"),
		nightTimer: document.getElementById("panel-nightTimer"),
		guess: document.getElementById("panel-guess"),
	};

	const playerCountInput = document.getElementById("playerCount");
	const setupError = document.getElementById("setupError");
	const questionError = document.getElementById("questionError");

	const termText = document.getElementById("termText");
	const termMiniText = document.getElementById("termMiniText");
	const termTextNight = document.getElementById("termTextNight");

	const turnPlayer = document.getElementById("turnPlayer");
	const roleCover = document.getElementById("roleCover");
	const roleReveal = document.getElementById("roleReveal");
	const roleText = document.getElementById("roleText");
	const roleHint = document.getElementById("roleHint");
	const explainArea = document.getElementById("explainArea");
	const explainText = document.getElementById("explainText");
	const explainTextNight = document.getElementById("explainTextNight");
	const prosecutorPublic = document.getElementById("prosecutorPublic");

	const timerText = document.getElementById("timerText");
	const guessGrid = document.getElementById("guessGrid");
	const guessResult = document.getElementById("guessResult");

	const btnConfirmPlayers = document.getElementById("btn-confirmPlayers");
	const btnBackHomeSetup = document.getElementById("btn-backHome-setup");
	const btnRedraw = document.getElementById("btn-redraw");
	const btnStartRoles = document.getElementById("btn-startRoles");
	const btnChangePlayers = document.getElementById("btn-changePlayers");
	const btnRevealRole = document.getElementById("btn-revealRole");
	const btnNextPlayer = document.getElementById("btn-nextPlayer");
	const btnViewExplain = document.getElementById("btn-viewExplain");
	const btnStartNight = document.getElementById("btn-startNight");
	const btnViewExplainNight = document.getElementById("btn-viewExplainNight");
	const btnRestart = document.getElementById("btn-restart");
	const btnBackHomeEnd = document.getElementById("btn-backHome-end");

	/** @type {GameState} */
	let state = "setup";
	let playerCount = 5;
	/** @type {Question | null} */
	let currentQuestion = null;

	/** @type {Array<"prosecutor"|"witness"|"criminal">} */
	let roles = [];
	let prosecutorIndex = -1;
	let witnessIndex = -1;
	let currentPlayerIndex = 0;

	let nightSecondsLeft = 60;
	/** @type {number | null} */
	let nightTimerId = null;

	function goHome() {
		location.href = "../../index.html";
	}

	function clampInt(value, min, max) {
		const n = Number.parseInt(String(value), 10);
		if (!Number.isFinite(n)) return null;
		return Math.min(max, Math.max(min, n));
	}

	function setState(nextState) {
		state = nextState;
		for (const [k, el] of Object.entries(panels)) {
			if (!el) continue;
			el.hidden = k !== nextState;
		}
	}

	function clearErrors() {
		if (setupError) setupError.textContent = "";
		if (questionError) questionError.textContent = "";
	}

	function getQuestionBank() {
		const bank = window.questionBank;
		if (!Array.isArray(bank)) return [];
		return bank
			.filter((q) => q && typeof q.term === "string" && typeof q.explanation === "string")
			.map((q) => ({ term: q.term.trim(), explanation: q.explanation.trim() }))
			.filter((q) => q.term.length > 0 && q.explanation.length > 0);
	}

	function pickRandomQuestion() {
		const bank = getQuestionBank();
		if (bank.length === 0) return null;
		return bank[Math.floor(Math.random() * bank.length)];
	}

	function setTermUI() {
		const term = currentQuestion?.term ?? "—";
		if (termText) termText.textContent = term;
		if (termMiniText) termMiniText.textContent = term;
		if (termTextNight) termTextNight.textContent = term;
	}

	function shuffleInPlace(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}

	function assignRoles() {
		roles = new Array(playerCount).fill("criminal");
		prosecutorIndex = Math.floor(Math.random() * playerCount);
		do {
			witnessIndex = Math.floor(Math.random() * playerCount);
		} while (witnessIndex === prosecutorIndex);
		roles[prosecutorIndex] = "prosecutor";
		roles[witnessIndex] = "witness";
	}

	function resetRoleView() {
		currentPlayerIndex = 0;
		if (roleCover) roleCover.hidden = false;
		if (roleReveal) roleReveal.hidden = true;
		if (explainText) explainText.hidden = true;
		if (explainText) explainText.textContent = "";
		if (explainArea) explainArea.hidden = true;
		updateRoleTurnUI();
	}

	function updateRoleTurnUI() {
		const n = currentPlayerIndex + 1;
		if (turnPlayer) turnPlayer.textContent = `請把螢幕交給玩家 ${n}`;
		if (roleText) roleText.textContent = "—";
		if (roleHint) roleHint.textContent = "—";
		if (explainArea) explainArea.hidden = true;
		if (explainText) {
			explainText.hidden = true;
			explainText.textContent = "";
		}
	}

	function revealCurrentRole() {
		const role = roles[currentPlayerIndex];
		const playerNumber = currentPlayerIndex + 1;
		const term = currentQuestion?.term ?? "—";

		if (roleCover) roleCover.hidden = true;
		if (roleReveal) roleReveal.hidden = false;

		if (role === "prosecutor") {
			if (roleText) roleText.textContent = "你是檢察官";
			if (roleHint) roleHint.textContent = `你的編號是 ${playerNumber}（可以公開）。題目是「${term}」。請聽大家的說法，最後猜誰是目擊證人。`;
			if (explainArea) explainArea.hidden = true;
			return;
		}

		if (role === "criminal") {
			if (roleText) roleText.textContent = "你是犯人";
			if (roleHint) roleHint.textContent = `題目是「${term}」。請你唬爛題目，讓檢察官以為你是目擊證人。`;
			if (explainArea) explainArea.hidden = true;
			return;
		}

		// witness
		if (roleText) roleText.textContent = "你是目擊證人";
		if (roleHint) roleHint.textContent = `題目是「${term}」。你可以偷偷按「查看解釋」看正確解釋。`;
		if (explainArea) explainArea.hidden = false;
	}

	function nextPlayer() {
		currentPlayerIndex += 1;
		if (currentPlayerIndex >= playerCount) {
			// All roles viewed
			setState("nightReady");
			setTermUI();
			if (prosecutorPublic) prosecutorPublic.textContent = `檢察官是 ${prosecutorIndex + 1} 號（可公開）`;
			return;
		}
		if (roleCover) roleCover.hidden = false;
		if (roleReveal) roleReveal.hidden = true;
		updateRoleTurnUI();
	}

	function stopNightTimer() {
		if (nightTimerId !== null) {
			clearInterval(nightTimerId);
			nightTimerId = null;
		}
	}

	function startNightTimer() {
		stopNightTimer();
		nightSecondsLeft = 60;
		if (timerText) timerText.textContent = String(nightSecondsLeft);
		if (explainTextNight) {
			explainTextNight.hidden = true;
			explainTextNight.textContent = "";
		}
		setState("nightTimer");

		nightTimerId = window.setInterval(() => {
			nightSecondsLeft -= 1;
			if (timerText) timerText.textContent = String(Math.max(0, nightSecondsLeft));
			if (nightSecondsLeft <= 0) {
				stopNightTimer();
				enterGuess();
			}
		}, 1000);
	}

	function enterGuess() {
		setState("guess");
		if (guessResult) guessResult.textContent = "";
		buildGuessButtons();
	}

	function buildGuessButtons() {
		if (!guessGrid) return;
		guessGrid.textContent = "";
		const buttons = [];
		for (let i = 1; i <= playerCount; i++) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "guessBtn";
			btn.textContent = `${i} 號`;
			btn.addEventListener("click", () => onGuess(i - 1), { once: true });
			buttons.push(btn);
			guessGrid.appendChild(btn);
		}
		// Disable other buttons after first guess
		function disableAll() {
			for (const b of buttons) b.disabled = true;
		}
		function onGuess(index) {
			disableAll();
			const correct = index === witnessIndex;
			if (!guessResult) return;
			guessResult.textContent = correct
				? `猜對了！${index + 1} 號是目擊證人。`
				: `猜錯了！正確答案是 ${witnessIndex + 1} 號。`;
		}
	}

	function restartGame() {
		stopNightTimer();
		clearErrors();
		currentQuestion = null;
		roles = [];
		prosecutorIndex = -1;
		witnessIndex = -1;
		currentPlayerIndex = 0;
		if (playerCountInput) playerCountInput.value = String(playerCount);
		setState("setup");
	}

	// Event wiring
	btnBackHomeSetup?.addEventListener("click", goHome);
	btnBackHomeEnd?.addEventListener("click", goHome);

	btnConfirmPlayers?.addEventListener("click", () => {
		clearErrors();
		const n = clampInt(playerCountInput?.value ?? "", 3, 20);
		if (n === null) {
			if (setupError) setupError.textContent = "請輸入有效的玩家數量（3～20）";
			return;
		}
		playerCount = n;
		currentQuestion = pickRandomQuestion();
		if (!currentQuestion) {
			if (setupError) setupError.textContent = "題庫是空的，請先在 questions.js 填入題目";
			return;
		}
		setTermUI();
		setState("question");
	});

	btnChangePlayers?.addEventListener("click", () => {
		stopNightTimer();
		clearErrors();
		setState("setup");
	});

	btnRedraw?.addEventListener("click", () => {
		clearErrors();
		const q = pickRandomQuestion();
		if (!q) {
			if (questionError) questionError.textContent = "題庫是空的，請先在 questions.js 填入題目";
			return;
		}
		currentQuestion = q;
		setTermUI();
	});

	btnStartRoles?.addEventListener("click", () => {
		clearErrors();
		if (!currentQuestion) {
			if (questionError) questionError.textContent = "請先抽題目";
			return;
		}
		assignRoles();
		resetRoleView();
		setTermUI();
		setState("roles");
	});

	btnRevealRole?.addEventListener("click", () => {
		if (!currentQuestion) return;
		revealCurrentRole();
	});

	btnNextPlayer?.addEventListener("click", () => {
		nextPlayer();
	});

	btnViewExplain?.addEventListener("click", () => {
		if (!currentQuestion) return;
		// Honor system: this button is only shown for witness.
		if (explainText) {
			const willShow = explainText.hidden;
			explainText.hidden = !willShow;
			explainText.textContent = willShow ? currentQuestion.explanation : "";
		}
	});

	btnStartNight?.addEventListener("click", () => {
		if (!currentQuestion) return;
		startNightTimer();
	});

	btnViewExplainNight?.addEventListener("click", () => {
		if (!currentQuestion || !explainTextNight) return;
		const willShow = explainTextNight.hidden;
		explainTextNight.hidden = !willShow;
		explainTextNight.textContent = willShow ? currentQuestion.explanation : "";
	});

	btnRestart?.addEventListener("click", () => {
		restartGame();
	});

	// Initial state
	(function init() {
		clearErrors();
		setState("setup");
		const n = clampInt(playerCountInput?.value ?? "5", 3, 20);
		playerCount = n ?? 5;
	})();
})();

