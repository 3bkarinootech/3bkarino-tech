// Transition عند تحميل الصفحة
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

// صوت عند الضغط
const clickAudio = document.getElementById("click-audio");
document.querySelectorAll(".click-sound").forEach(el => {
  el.addEventListener("click", () => {
    clickAudio.currentTime = 0;
    clickAudio.play();
  });
});
