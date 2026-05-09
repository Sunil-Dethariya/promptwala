const particleCanvas = document.querySelector(".particle-canvas");

if (particleCanvas) {
  const context = particleCanvas.getContext("2d");
  const rootStyles = getComputedStyle(document.documentElement);
  const particleColor = rootStyles.getPropertyValue("--color-blue").trim() || "#4da8ff";
  const lineColor = rootStyles.getPropertyValue("--color-purple").trim() || "#a855f7";
  const glowColor = rootStyles.getPropertyValue("--color-pink").trim() || "#ff4d6d";
  const particleCount = 120;
  const particles = [];
  const mouse = {
    x: null,
    y: null,
    radius: 140
  };

  function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }

  function randomVelocity() {
    return (Math.random() - 0.5) * 0.75;
  }

  function createParticles() {
    particles.length = 0;

    for (let index = 0; index < particleCount; index += 1) {
      particles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        vx: randomVelocity(),
        vy: randomVelocity(),
        size: 1.4 + Math.random() * 2.2
      });
    }
  }

  function updateParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x <= 0 || particle.x >= particleCanvas.width) {
      particle.vx *= -1;
    }

    if (particle.y <= 0 || particle.y >= particleCanvas.height) {
      particle.vy *= -1;
    }

    if (mouse.x === null || mouse.y === null) {
      return;
    }

    const deltaX = particle.x - mouse.x;
    const deltaY = particle.y - mouse.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 0 && distance < mouse.radius) {
      const force = (mouse.radius - distance) / mouse.radius;
      particle.vx += (deltaX / distance) * force * 0.03;
      particle.vy += (deltaY / distance) * force * 0.03;
    }

    particle.vx *= 0.995;
    particle.vy *= 0.995;

    if (Math.abs(particle.vx) < 0.08) {
      particle.vx += randomVelocity() * 0.08;
    }

    if (Math.abs(particle.vy) < 0.08) {
      particle.vy += randomVelocity() * 0.08;
    }
  }

  function drawParticle(particle) {
    context.beginPath();
    context.fillStyle = particleColor;
    context.shadowBlur = 18;
    context.shadowColor = glowColor;
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fill();
  }

  function connectParticles() {
    for (let first = 0; first < particles.length; first += 1) {
      for (let second = first + 1; second < particles.length; second += 1) {
        const particleA = particles[first];
        const particleB = particles[second];
        const distance = Math.hypot(particleA.x - particleB.x, particleA.y - particleB.y);

        if (distance < 110) {
          context.beginPath();
          context.strokeStyle = lineColor;
          context.globalAlpha = 0.16 - distance / 900;
          context.lineWidth = 1;
          context.moveTo(particleA.x, particleA.y);
          context.lineTo(particleB.x, particleB.y);
          context.stroke();
        }
      }
    }

    context.globalAlpha = 1;
  }

  function animateParticles() {
    context.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    particles.forEach((particle) => {
      updateParticle(particle);
      drawParticle(particle);
    });

    connectParticles();
    requestAnimationFrame(animateParticles);
  }

  // Keep particle movement reactive but subtle around cursor proximity.
  window.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    createParticles();
  });

  resizeCanvas();
  createParticles();
  animateParticles();
}
