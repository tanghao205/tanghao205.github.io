const navigation = document.querySelector("#navigation");
const menuButton = document.querySelector(".menu-toggle");

document.querySelectorAll(".university-trigger").forEach((button) => {
  const label = document.getElementById(button.getAttribute("popovertarget"));
  const positionLabel = () => {
    const rect = button.getBoundingClientRect();
    label.style.top = `${rect.bottom + 10}px`;
    const width = label.getBoundingClientRect().width || Math.min(300, innerWidth - 32);
    label.style.left = `${Math.max(16, Math.min(rect.left, innerWidth - width - 16))}px`;
  };
  label.addEventListener("beforetoggle", (event) => {
    if (event.newState === "open") positionLabel();
  });
  label.addEventListener("toggle", () => {
    const open = label.matches(":popover-open");
    button.setAttribute("aria-expanded", String(open));
    if (open) positionLabel();
  });
  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") label.showPopover();
  });
  button.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") label.hidePopover();
  });
  window.addEventListener("resize", () => label.hidePopover());
  window.addEventListener("scroll", () => label.hidePopover(), { passive: true });
});

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
}

menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(expanded));
  navigation.classList.toggle("is-open", expanded);
});
navigation
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".header-inner")) closeMenu();
});
matchMedia("(min-width: 761px)").addEventListener("change", closeMenu);

const projects = {
  vision: {
    category: "ACADEMIC EXPLORATION / MACHINE LEARNING",
    title: "Teaching machines to see",
    description:
      "Using the CIFAR-10 dataset, I compared a fully connected network, a convolutional network, and ResNet in PyTorch. The project explored how architecture and training choices change image classification performance.",
    image: "/images/cifar10.jpg",
    alt: "Sample images from the ten CIFAR-10 object categories",
    tools: "Python · PyTorch · Convolutional neural networks · ResNet",
  },
  storms: {
    category: "ACADEMIC EXPLORATION / DISTRIBUTED COMPUTING",
    title: "Finding patterns in storms",
    description:
      "I used Java MapReduce workflows in Docker to process US storm-event data, visualize historical patterns, and compare processing time across input sizes. The experiment also examined the overhead of a distributed computation framework.",
    image: "/images/Storm_event.jpg",
    alt: "Historical storm event counts in ten representative US states",
    tools: "Java · Docker · MapReduce · Data analysis",
  },
  visualization: {
    category: "ACADEMIC EXPLORATION / DATA VISUALIZATION",
    title: "Making complex data clear",
    description:
      "I explored historical patterns in the Global Terrorism Database through Tableau and D3.js. The goal was to make a large, complex dataset easier to explore through visual comparisons across countries and time.",
    image: "/images/GTD.jpg",
    alt: "Tableau visualization of historical global terrorism data",
    tools: "D3.js · Tableau · Visual storytelling",
  },
};

const dialog = document.querySelector("#project-dialog");
let projectTrigger;
document.querySelectorAll("[data-project]").forEach((button) => {
  button.addEventListener("click", () => {
    const project = projects[button.dataset.project];
    projectTrigger = button;
    document.querySelector("#dialog-category").textContent = project.category;
    document.querySelector("#dialog-title").textContent = project.title;
    document.querySelector("#dialog-description").textContent = project.description;
    const image = document.querySelector("#dialog-image");
    image.src = project.image;
    image.alt = project.alt;
    document.querySelector("#dialog-tools").textContent = project.tools;
    dialog.showModal();
    document.body.classList.add("dialog-open");
  });
});
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom)
  )
    dialog.close();
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  requestAnimationFrame(() => projectTrigger?.focus({ preventScroll: true }));
});

// Content remains visible when JavaScript or motion effects are unavailable.
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("has-entered");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  document
    .querySelectorAll(".section-heading, .about-intro, .project-card")
    .forEach((element) => observer.observe(element));
}
