gsap.registerPlugin(ScrollTrigger);

const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const revealItems = document.querySelectorAll(".reveal");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("is-open");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
    });
  });
}

const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

heroTimeline.to(".hero .reveal", {
  opacity: 1,
  y: 0,
  duration: 0.9,
  stagger: 0.12
});

revealItems.forEach((item) => {
  if (item.closest(".hero")) {
    return;
  }

  gsap.to(item, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: {
      trigger: item,
      start: "top 82%"
    }
  });
});