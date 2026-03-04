document.addEventListener("DOMContentLoaded", function () {
  // Configuration
  const PIN_CODE = "0603";
  const FIREWORK_DURATION_MS = 4000;
  const MAX_PARTICLES = 50;

  // DOM references
  const lockSection = document.getElementById("lockScreen");
  const lockCard = document.getElementById("lockCard");
  const pinDots = Array.from(document.querySelectorAll(".pin-dot"));
  const keypadButtons = Array.from(document.querySelectorAll(".key-btn"));

  const celebrationSection = document.getElementById("celebration");
  const beginBtn = document.getElementById("beginBtn");
  const fireworksCanvas = document.getElementById("fireworksCanvas");
  const cakeContainer = document.getElementById("cakeContainer");

  const timelineSection = document.getElementById("timeline");
  const memoryCards = Array.from(
    timelineSection.querySelectorAll(".memory-card")
  );
  const toLetterBtn = document.getElementById("toLetterBtn");

  const letterSection = document.getElementById("letterSection");
  const envelopeWrapper = document.getElementById("envelopeWrapper");
  const letterOverlay = document.getElementById("letterOverlay");

  // Guard if critical elements are missing
  if (
    !lockSection ||
    !lockCard ||
    !pinDots.length ||
    !keypadButtons.length ||
    !celebrationSection ||
    !beginBtn ||
    !fireworksCanvas ||
    !timelineSection ||
    !memoryCards.length ||
    !toLetterBtn ||
    !letterSection ||
    !envelopeWrapper ||
    !letterOverlay
  ) {
    return;
  }

  // -------------------------
  // PIN lock logic
  // -------------------------
  let currentPin = "";
  let isLocked = true;
  let isAnimatingLock = false;

  function updatePinDots() {
    pinDots.forEach((dot, index) => {
      if (index < currentPin.length) {
        dot.classList.add("pin-dot-filled");
      } else {
        dot.classList.remove("pin-dot-filled");
      }
    });
  }

  function resetPin() {
    currentPin = "";
    updatePinDots();
  }

  function handleUnlockSuccess() {
    if (!isLocked || isAnimatingLock) return;
    isLocked = false;
    isAnimatingLock = true;

    // Fade out lock screen
    lockSection.classList.add("opacity-0");

    window.setTimeout(() => {
      lockSection.classList.add("hidden");
      celebrationSection.classList.remove("hidden");
      celebrationSection.classList.remove("opacity-0");
      timelineSection.classList.remove("hidden");
      letterSection.classList.remove("hidden");

      // Start cake animation (class already present) and fireworks
      startFireworks();

      isAnimatingLock = false;
    }, 550);
  }

  function handleUnlockError() {
    if (isAnimatingLock) return;

    lockCard.classList.remove("pin-error");
    // Force reflow to restart animation
    void lockCard.offsetWidth;
    lockCard.classList.add("pin-error");

    window.setTimeout(() => {
      lockCard.classList.remove("pin-error");
      resetPin();
    }, 340);
  }

  function handleKeyInput(key) {
    if (!isLocked) return;

    if (key === "clear") {
      resetPin();
      return;
    }

    if (key === "backspace") {
      currentPin = currentPin.slice(0, -1);
      updatePinDots();
      return;
    }

    if (!/^\d$/.test(key)) return;

    if (currentPin.length >= 4) return;

    currentPin += key;
    updatePinDots();

    if (currentPin.length === 4) {
      if (currentPin === PIN_CODE) {
        handleUnlockSuccess();
      } else {
        handleUnlockError();
      }
    }
  }

  keypadButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const key = this.getAttribute("data-key");
      if (!key) return;
      handleKeyInput(key);
    });
  });

  // -------------------------
  // Celebration navigation
  // -------------------------
  beginBtn.addEventListener("click", function () {
    timelineSection.scrollIntoView({ behavior: "smooth" });
  });

  // -------------------------
  // Fireworks canvas
  // -------------------------
  function startFireworks() {
    const ctx = fireworksCanvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to its container
    const containerRect = celebrationSection.getBoundingClientRect();
    fireworksCanvas.width = containerRect.width;
    fireworksCanvas.height = containerRect.height;

    const particles = [];

    function createParticle() {
      const x = Math.random() * fireworksCanvas.width;
      const y = Math.random() * (fireworksCanvas.height * 0.5);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 0.7;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 600 + Math.random() * 400;

      return {
        x,
        y,
        vx,
        vy,
        life,
        age: 0,
        radius: 1.5 + Math.random() * 1.8,
      };
    }

    function addParticles() {
      if (particles.length >= MAX_PARTICLES) return;
      const count = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count && particles.length < MAX_PARTICLES; i += 1) {
        particles.push(createParticle());
      }
    }

    let startTime = null;
    let animationId = null;

    function draw(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

      if (elapsed < FIREWORK_DURATION_MS) {
        addParticles();
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.age += 16;
        p.x += p.vx;
        p.y += p.vy;

        const fade = 1 - p.age / p.life;
        if (fade <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = fade;
        ctx.fillStyle = "#4DA3FF";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (elapsed < FIREWORK_DURATION_MS || particles.length > 0) {
        animationId = window.requestAnimationFrame(draw);
      } else if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
    }

    window.requestAnimationFrame(draw);
  }

  // -------------------------
  // Timeline IntersectionObserver
  // -------------------------
  function setupTimelineObserver() {
    if (!("IntersectionObserver" in window)) {
      memoryCards.forEach((card) => {
        card.classList.add("memory-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("memory-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    memoryCards.forEach((card) => observer.observe(card));
  }

  setupTimelineObserver();

  // Button to scroll to letter
  toLetterBtn.addEventListener("click", function () {
    letterSection.scrollIntoView({ behavior: "smooth" });
  });

  // -------------------------
  // Envelope interactions
  // -------------------------
  let isEnvelopeOpen = false;

  function openEnvelope() {
    if (isEnvelopeOpen) return;
    isEnvelopeOpen = true;

    envelopeWrapper.classList.add("envelope-open");
    letterOverlay.classList.add("active");
    envelopeWrapper.setAttribute("aria-expanded", "true");
  }

  envelopeWrapper.addEventListener("click", openEnvelope);
  envelopeWrapper.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEnvelope();
    }
  });
});

