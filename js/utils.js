// 成就提示函式
function showAchievement(msg) {
  const achievement = document.createElement('div');
  achievement.textContent = msg;
  achievement.className = 'achievement-toast';
  document.body.appendChild(achievement);
  setTimeout(() => {
    achievement.style.opacity = '0';
    achievement.addEventListener('transitionend', () => {
      achievement.remove();
    }, { once: true });
  }, 2500); // 2500ms visible, 500ms fade out
}
