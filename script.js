import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://kidfjyxnqopezhhulwrl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ROeN6_r-OGF7ZxgiRTcPlA_NW-YdxoX";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);



async function loadPortfolioProjects() {
  const portfolioGrid = document.getElementById("portfolio-grid");
  const categoryFilters = document.getElementById(
    "portfolio-category-filters"
  );

  if (!portfolioGrid) return;

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Portfolio loading failed:", error.message);
    portfolioGrid.textContent =
      "Our portfolio is temporarily unavailable.";
    return;
  }

  const projects = data || [];
  let selectedCategory = "all";

  
let allSubcategories = [];


let selectedSubcategory = "all";
const subcategoryFilters = document.getElementById(
  "portfolio-subcategory-filters"
);


function renderSubcategories(subcategories, categoryId) {
  if (!subcategoryFilters) return;

  subcategoryFilters.replaceChildren();

  const relevantSubcategories = subcategories.filter(
    (item) => item.category_id === categoryId
  );

  if (categoryId === "all" || relevantSubcategories.length === 0) {
    subcategoryFilters.hidden = true;
    selectedSubcategory = "all";
    return;
  }

  subcategoryFilters.hidden = false;
  selectedSubcategory = "all";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "portfolio-filter active";
  allButton.dataset.subcategory = "all";
  allButton.textContent = "All Subcategories";
  subcategoryFilters.appendChild(allButton);

  relevantSubcategories.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "portfolio-filter";
    button.dataset.subcategory = item.id;
    button.textContent = item.name;
    subcategoryFilters.appendChild(button);
  });
}

  function renderProjects() {
    portfolioGrid.replaceChildren();


const categoryProjects =
  selectedCategory === "all"
    ? projects
    : projects.filter(
        (project) =>
          project.category_id === selectedCategory ||
          project.category ===
            categoryFilters?.querySelector(
              `[data-category="${selectedCategory}"]`
            )?.textContent
      );

const filteredProjects =
  selectedSubcategory === "all"
    ? categoryProjects
    : categoryProjects.filter(
        (project) => project.subcategory_id === selectedSubcategory
      );


    if (filteredProjects.length === 0) {
      portfolioGrid.textContent =
        "No projects found in this category yet.";
      return;
    }

    filteredProjects.forEach((project) => {
      const card = document.createElement("article");
      card.className = "portfolio-card";

      const heading = document.createElement("h3");
      heading.textContent = project.title || "Untitled project";

      const category = document.createElement("p");
      category.textContent = project.category || "";

      card.append(heading, category);

      if (project.media_type === "video" && project.media_url) {
        const driveMatch = project.media_url.match(
  /drive\.google\.com\/file\/d\/([^/]+)/
);

if (driveMatch) {
  const frame = document.createElement("iframe");
  frame.src = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
          frame.title = project.title || "Portfolio video";
          frame.allow = "autoplay; encrypted-media; picture-in-picture";
          frame.allowFullscreen = true;
          frame.loading = "lazy";
          frame.style.width = "100%";
          frame.style.aspectRatio = "16 / 9";
          frame.style.border = "0";
          frame.style.borderRadius = "12px";
          card.appendChild(frame);
        } else {
          const video = document.createElement("video");
          video.src = project.media_url;
          video.controls = true;
          video.preload = "metadata";
          video.playsInline = true;
          video.style.width = "100%";
          video.style.borderRadius = "12px";
          card.appendChild(video);
        }
      } else if (project.media_type === "image" && project.media_url) {
        const image = document.createElement("img");
        const driveMatch = project.media_url.match(
  /drive\.google\.com\/file\/d\/([^/]+)/
);

image.src = driveMatch
  ? `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`
  : project.media_url;
        image.alt = project.title || "Portfolio project";
        image.loading = "lazy";
        image.style.width = "100%";
        image.style.height = "320px";
image.style.objectFit = "contain";
image.style.display = "block";
image.style.background = "#000";
        image.style.borderRadius = "12px";
        card.appendChild(image);
      }

      if (project.description) {
        const description = document.createElement("p");
        description.textContent = project.description;
        card.appendChild(description);
      }

      portfolioGrid.appendChild(card);
    });
  }

  if (categoryFilters) {
    const { data: categories, error: categoryError } = await supabase
      .from("portfolio_categories")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });

    if (categoryError) {
      console.error("Category loading failed:", categoryError.message);
    } else {
      
const { data: subcategories, error: subcategoryError } =
  await supabase
    .from("portfolio_subcategories")
    .select("id, category_id, name, sort_order")
    .order("sort_order", { ascending: true });

if (subcategoryError) {
  console.error(
    "Subcategory loading failed:",
    subcategoryError.message
  );
} else {
  allSubcategories = subcategories || [];
}

      const allButton = categoryFilters.querySelector(
        '[data-category="all"]'
      );

      categoryFilters.replaceChildren();

      if (allButton) {
        categoryFilters.appendChild(allButton);
      }

      (categories || []).forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "portfolio-filter";
        button.dataset.category = item.id;
        button.textContent = item.name;

        categoryFilters.appendChild(button);
      });

      categoryFilters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");

        if (!button || !categoryFilters.contains(button)) return;

        selectedCategory = button.dataset.category;
        
renderSubcategories(allSubcategories, selectedCategory);


        categoryFilters
          .querySelectorAll(".portfolio-filter")
          .forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
          });

        renderProjects();
      });
    }
  }

  if (subcategoryFilters) {
  subcategoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-subcategory]");

    if (!button || !subcategoryFilters.contains(button)) return;

    selectedSubcategory = button.dataset.subcategory;

    subcategoryFilters
      .querySelectorAll(".portfolio-filter")
      .forEach((filterButton) => {
        const isActive = filterButton === button;

        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
      });

    renderProjects();
  });
}

  renderProjects();
}

loadPortfolioProjects();


const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);

    if (target) {
      event.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});

// BLUEART MARKETING — Booking Form Submission
const bookingForm = document.getElementById("booking-form");

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = bookingForm.querySelector(
      'button[type="submit"]'
    );
    const statusMessage = document.getElementById(
      "booking-message-status"
    );

    if (!submitButton || !statusMessage) return;

    const formData = new FormData(bookingForm);

    const booking = {
      customer_name: formData.get("customer_name")?.toString().trim(),
      customer_email: formData.get("customer_email")?.toString().trim(),
      customer_phone: formData.get("customer_phone")?.toString().trim() || null,
      service: formData.get("service")?.toString(),
      booking_date: formData.get("booking_date")?.toString() || null,
      message: formData.get("message")?.toString().trim() || null
    };

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    statusMessage.textContent = "";

    try {
      const { error } = await supabase
        .from("bookings")
        .insert([booking]);

      if (error) throw error;

      statusMessage.textContent =
        "Your booking request has been sent successfully!";
      statusMessage.style.color = "#65e6a5";
      bookingForm.reset();
    } catch (error) {
      console.error("Booking submission failed:", error);
      statusMessage.textContent =
        "Sorry, we couldn't send your request. Please try again.";
      statusMessage.style.color = "#ff8a8a";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send Booking Request";
    }
  });
}

console.log("BLUEART website loaded successfully!");
