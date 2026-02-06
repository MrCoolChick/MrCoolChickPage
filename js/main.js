document.addEventListener('DOMContentLoaded', () => {
    // 頁面載入時滾動到頂部
    if ('scrollRestoration' in history) {
        window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // 自動更新頁尾年份
    const footerYear = document.getElementById('footerYear');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
});
