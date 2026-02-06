let availableQuestions = [];

// 初始化：直接使用 questions.js 中的 questionBank
function initGame() {
    // 複製一份題庫作為可抽取的列表
    availableQuestions = [...questionBank];
    document.getElementById('questionArea').innerHTML = '<p>題庫已載入，準備好抽題！</p>';
}

// 抽題邏輯
function drawQuestions() {
    const questionArea = document.getElementById('questionArea');
    questionArea.innerHTML = ''; // 清空舊題目

    if (availableQuestions.length === 0) {
        alert('所有題目都抽過囉！請點擊「重置題庫」重新開始。');
        return;
    }

    const drawnQuestions = [];
    // 抽 6 個，但如果剩下的題目小於 6 個，就全部抽出來
    const numToDraw = Math.min(6, availableQuestions.length);
    
    for (let i = 0; i < numToDraw; i++) {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const question = availableQuestions.splice(randomIndex, 1)[0];
        drawnQuestions.push(question);
    }

    // 顯示題目
    drawnQuestions.forEach(q => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerText = q;
        questionArea.appendChild(card);
    });
}

// 事件監聽
document.getElementById('drawBtn').addEventListener('click', drawQuestions);
document.getElementById('resetBtn').addEventListener('click', initGame);

// 網頁載入時初始化
initGame();