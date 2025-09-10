// تشغيل صوت عند الضغط
document.querySelectorAll('.click-sound').forEach(el => {
  el.addEventListener('click', () => {
    const audio = document.getElementById('click-audio');
    audio.currentTime = 0;
    audio.play();
  });
});
