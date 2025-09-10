document.addEventListener('DOMContentLoaded', function () {
  const audio = document.getElementById('click-audio');
  document.querySelectorAll('.click-sound').forEach(el => {
    el.addEventListener('click', () => {
      audio.currentTime = 0;
      audio.play();
    });
  });
});
