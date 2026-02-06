document.addEventListener('DOMContentLoaded', () => {

    // 頁面載入時解鎖成就4: 初次見面
    const lock4 = document.getElementById('lock4');
    if (lock4) {
        // 先檢查是否已經解鎖 (理論上剛載入是鎖住的，但如果有保存狀態的邏輯可擴展)
        lock4.classList.add('unlocked');
        if (typeof showAchievement === 'function') {
            showAchievement('達成成就：初次見面');
        }
    }

    // 偵測滾動到頁面底部解鎖成就1: 前往地心
    let achievement2Shown = false;
    window.addEventListener('scroll', function() {
        if (achievement2Shown) return;
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
            achievement2Shown = true;
            if (typeof showAchievement === 'function') {
                showAchievement('達成成就：前往地心');
            }
            const lock1 = document.getElementById('lock1');
            if (lock1) lock1.classList.add('unlocked');
        }
    });

    // 2分鐘後解鎖成就2: 流連忘返
    setTimeout(function() {
        const lock2 = document.getElementById('lock2');
        if (lock2 && !lock2.classList.contains('unlocked')) {
            lock2.classList.add('unlocked');
            if (typeof showAchievement === 'function') {
                showAchievement('達成成就：流連忘返');
            }
        }
    }, 120000);

    // 點擊頭像10次解鎖成就3: 不要戳我
    let pokeCount = 0;
    const profileImg = document.querySelector('.profile-img');
    if (profileImg) {
        profileImg.addEventListener('click', function() {
            pokeCount++;
            if (pokeCount === 10) {
                const lock3 = document.getElementById('lock3');
                if (lock3) lock3.classList.add('unlocked');
                if (typeof showAchievement === 'function') {
                    showAchievement('達成成就：不要戳我');
                }
            }
        });
    }

    // 點擊隱藏成就圖片解鎖成就5: 隱藏成就
    const lock5 = document.getElementById('lock5');
    if (lock5) {
        lock5.addEventListener('click', function() {
            lock5.classList.add('unlocked');
            if (typeof showAchievement === 'function') {
                showAchievement('達成成就：隱藏成就');
            }
        });
    }

    // 深夜進站解鎖成就6: 深夜探險
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 0 && hour < 4) {
        const lock6 = document.getElementById('lock6');
        if (lock6 && !lock6.classList.contains('unlocked')) {
            lock6.classList.add('unlocked');
            if (typeof showAchievement === 'function') {
                showAchievement('達成成就：深夜探險');
            }
        }
    }

    // 點擊「回到頂部」5次解鎖成就7: 頂天立地
    let topClickCount = 0;
    const topLink = document.querySelector('a[href="#top"]');
    if (topLink) {
        topLink.addEventListener('click', function() {
            topClickCount++;
            if (topClickCount === 5) {
                const lock7 = document.getElementById('lock7');
                if (lock7) lock7.classList.add('unlocked');
                if (typeof showAchievement === 'function') {
                    showAchievement('達成成就：頂天立地');
                }
            }
        });
    }
});
