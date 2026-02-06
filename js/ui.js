// 漢堡選單切換
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            document.querySelector('.header-nav').classList.toggle('active');
        });
    }
});
