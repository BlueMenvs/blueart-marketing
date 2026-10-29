
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://kidfjyxnqopezhhulwrl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ROeN6_r-OGF7ZxgiRTcPlA_NW-YdxoX";
const ADMIN_EMAIL = "bluemenofficial@gmail.com";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let allBookings = [];

const message = document.getElementById("dashboard-message");
const logoutButton = document.getElementById("logout-button");
const projectForm = document.getElementById("project-form");
const saveButton = document.getElementById("save-project-button");
const projectsList = document.getElementById("projects-list");

async function checkAdminSession() {
  message.textContent = "Checking admin session...";

  const { data, error } = await supabase.auth.getUser();

  if (
    error ||
    !data.user ||
    data.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
  ) {
    await supabase.auth.signOut();
    window.location.replace("admin.html");
    return false;
  }

  message.textContent = `Signed in as ${data.user.email}`;
  message.style.color = "#42d9f5";

  return true;
}


async function updateProject(projectId, updates) {
  const allowedMediaTypes = ["image", "video"];

  if (!allowedMediaTypes.includes(updates.media_type)) {
    message.textContent = "Media type must be image or video.";
    message.style.color = "#ff8585";
    return;
  }

  const { error } = await supabase
    .from("portfolio_projects")
    .update(updates)
    .eq("id", projectId);

  if (error) {
    message.textContent = `Update failed: ${error.message}`;
    message.style.color = "#ff8585";
    return;
  }

  message.textContent = "Project updated successfully.";
  message.style.color = "#42d9f5";

  await loadProjects();
}


async function loadProjects() {
  console.log("loadProjects function started");

  projectsList.textContent = "Loading projects...";

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .order("created_at", { ascending: false });

 
if (error) {
  projectsList.textContent = `Could not load projects: ${error.message}`;

  message.textContent = `Database error: ${error.message}`;
  message.style.color = "#ff8585";

  return;
}



  const totalElement = document.getElementById("total-projects");
  const publishedElement = document.getElementById("published-projects");
  const draftElement = document.getElementById("draft-projects");

  if (totalElement) {
    totalElement.textContent = String(data.length);
  }

  if (publishedElement) {
    publishedElement.textContent = String(
      data.filter((project) => project.published).length
    );
  }

  if (draftElement) {
    draftElement.textContent = String(
      data.filter((project) => !project.published).length
    );
  }


  projectsList.replaceChildren();

  if (!data || data.length === 0) {
    projectsList.textContent = "No projects added yet.";
    return;
  }


data.forEach((project) => {
  
const item = document.createElement("div");
item.className = "project-row";


  const title = document.createElement("h3");
  title.textContent = project.title;

  const details = document.createElement("p");
  details.textContent =
    `${project.category} • ${project.media_type} • ` +
    (project.published ? "Published" : "Draft");

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.style.marginRight = "10px";

  editButton.addEventListener("click", () => {
    const newTitle = prompt("Enter project title:", project.title);
    if (newTitle === null || !newTitle.trim()) return;

    const newCategory = prompt(
      "Enter project category:",
      project.category
    );
    if (newCategory === null || !newCategory.trim()) return;

    const newDescription = prompt(
      "Enter project description:",
      project.description || ""
    );
    if (newDescription === null) return;

    const newMediaUrl = prompt(
      "Enter media URL:",
      project.media_url
    );
    if (newMediaUrl === null || !newMediaUrl.trim()) return;

    const newMediaType = prompt(
      "Enter media type (image or video):",
      project.media_type
    );
    if (newMediaType === null) return;

    const newPublished = confirm(
      "OK = Publish this project\nCancel = Keep it as a draft"
    );

    updateProject(project.id, {
      title: newTitle.trim(),
      category: newCategory.trim(),
      description: newDescription,
      media_url: newMediaUrl.trim(),
      media_type: newMediaType.trim().toLowerCase(),
      published: newPublished
    });
  });

  const deleteButton = document.createElement("button");
deleteButton.type = "button";
deleteButton.className = "delete-button";
deleteButton.textContent = "Delete";
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", async () => {
    const confirmed = confirm(
      `Delete "${project.title}" permanently?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("portfolio_projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      message.textContent = `Delete failed: ${error.message}`;
      message.style.color = "#ff8585";
      return;
    }

    message.textContent = "Project deleted successfully.";
    message.style.color = "#42d9f5";

    await loadProjects();
  });

  item.append(title, details, editButton, deleteButton);
  projectsList.appendChild(item);
});

}

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  
const categorySelect = document.getElementById("project-category");
const subcategorySelect = document.getElementById("project-subcategory");
const clientSelect = document.getElementById("project-client");

const project = {
  title: document.getElementById("project-title").value.trim(),

  // Keep the existing category text field populated
  category: categorySelect.selectedOptions[0]?.textContent || "",

  category_id: categorySelect.value,
  subcategory_id: subcategorySelect.value || null,
  client_id: clientSelect.value || null,

  description: document.getElementById("project-description").value.trim(),
  media_url: document.getElementById("project-media-url").value.trim(),
  media_type: document.getElementById("project-media-type").value,
  published: document.getElementById("project-published").checked
};


  saveButton.disabled = true;
  saveButton.textContent = "Saving...";
  message.textContent = "";

  try {
    const isAdmin = await checkAdminSession();

    if (!isAdmin) return;

    const { error } = await supabase
      .from("portfolio_projects")
      .insert(project);

    if (error) throw error;

    message.textContent = "Project saved successfully!";
    message.style.color = "#42d9f5";

    projectForm.reset();
    await loadProjects();
  } catch (error) {
    message.textContent =
      error.message || "Could not save the project.";
    message.style.color = "#ff8585";
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Project";
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  const { error } = await supabase.auth.signOut();

  if (error) {
    message.textContent = "Sign out failed. Please try again.";
    logoutButton.disabled = false;
    return;
  }

  window.location.replace("admin.html");
});

async function startDashboard() {

  const isAdmin = await checkAdminSession();

if (!isAdmin) return;

await loadProjects();


const sectionTitles = {
  overview: "Dashboard Overview",
  "add-project": "Add New Project",
  "all-projects": "All Projects",
  categories: "Manage Categories",
  subcategories: "Manage Subcategories",
  clients: "Manage Clients",
  bookings: "Manage Bookings",
  settings: "Settings"
};


document.querySelectorAll("[data-section]").forEach((button) => {
  button.addEventListener("click", async () => {
    const targetId = button.dataset.section;
    const targetSection = document.getElementById(targetId);

    if (!targetSection) return;

    document.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.remove("active");
    });

    targetSection.classList.add("active");

    document.querySelectorAll(".sidebar-nav [data-section]").forEach((navButton) => {
      navButton.classList.toggle("active", navButton.dataset.section === targetId);
    });

    const title = document.getElementById("topbar-title");

    if (title) {
      title.textContent = sectionTitles[targetId] || "BLUEART Dashboard";
    }

    
if (targetId === "all-projects") {
  loadProjects();
}

if (targetId === "categories") {
  loadCategories();
}

if (targetId === "subcategories") {
  await loadCategories();
  await loadSubcategories();
}

if (targetId === "clients") {
  await loadClients();
}

if (targetId === "bookings") {
  await loadBookings();
}

  });
});

document.getElementById("settings-logout-button")?.addEventListener("click", () => {
  logoutButton.click();
});

}



async function loadCategories() {
  const list = document.getElementById("category-list");
  const subcategorySelect = document.getElementById("subcategory-category");

  const { data, error } = await supabase
    .from("portfolio_categories")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    if (list) list.textContent = "Could not load categories.";
    console.error("Load categories failed:", error.message);
    return;
  }

  if (list) {
    list.replaceChildren();

    if (!data || data.length === 0) {
      list.textContent = "No categories yet. Add your first category above.";
    } else {
      data.forEach((category) => {
        const item = document.createElement("div");
        item.className = "project-row";

        const name = document.createElement("span");
        name.textContent = category.name;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
          const confirmed = confirm(
            `Delete "${category.name}"? Its subcategories will also be deleted.`
          );

          if (!confirmed) return;

          deleteButton.disabled = true;

          const { error: deleteError } = await supabase
            .from("portfolio_categories")
            .delete()
            .eq("id", category.id);

          if (deleteError) {
            console.error("Delete category failed:", deleteError.message);
            alert("Could not delete category. Please try again.");
            deleteButton.disabled = false;
            return;
          }

          alert("Category deleted successfully!");
          await loadCategories();
        });

        item.append(name, deleteButton);
        list.appendChild(item);
      });
    }
  }

  if (subcategorySelect) {
    const previousValue = subcategorySelect.value;
    subcategorySelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a category";
    subcategorySelect.appendChild(placeholder);

    (data || []).forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      subcategorySelect.appendChild(option);
    });

    if ((data || []).some((category) => category.id === previousValue)) {
      subcategorySelect.value = previousValue;
    }
  }
}

const categoryForm = document.getElementById("category-form");

if (categoryForm) {
  categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = document.getElementById("category-name");
    const message = document.getElementById("category-message");
    const name = input.value.trim();

    if (!name) return;

    message.textContent = "Saving category...";

    const { error } = await supabase
      .from("portfolio_categories")
      .insert([{ name }]);

    if (error) {
      message.textContent =
        error.code === "23505"
          ? "This category already exists."
          : "Could not save category. Please try again.";

      console.error("Add category failed:", error.message);
      return;
    }

    message.textContent = "Category added successfully!";
    input.value = "";

    await loadCategories();
  });
}


async function loadSubcategories() {
  const list = document.getElementById("subcategory-list");

  const { data, error } = await supabase
    .from("portfolio_subcategories")
    .select("id, name, category_id, portfolio_categories(name)")
    .order("name", { ascending: true });

  if (error) {
    if (list) list.textContent = "Could not load subcategories.";
    console.error("Load subcategories failed:", error.message);
    return;
  }

  if (!list) return;

  list.replaceChildren();

  if (!data || data.length === 0) {
    list.textContent = "No subcategories yet. Add one above.";
    return;
  }

  data.forEach((subcategory) => {
    const item = document.createElement("div");
    item.className = "project-row";

    const details = document.createElement("div");

    const name = document.createElement("span");
    name.textContent = subcategory.name;

    const category = document.createElement("p");
    category.textContent =
      subcategory.portfolio_categories?.name || "Uncategorized";
    category.style.color = "#42d9f5";
    category.style.fontSize = "13px";
    category.style.margin = "6px 0 0";

    details.append(name, category);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      const confirmed = confirm(
        `Delete subcategory "${subcategory.name}"? Projects will be kept.`
      );

      if (!confirmed) return;

      deleteButton.disabled = true;

      const { error: deleteError } = await supabase
        .from("portfolio_subcategories")
        .delete()
        .eq("id", subcategory.id);

      if (deleteError) {
        console.error("Delete subcategory failed:", deleteError.message);
        alert("Could not delete subcategory. Please try again.");
        deleteButton.disabled = false;
        return;
      }

      alert("Subcategory deleted successfully!");
      await loadSubcategories();
    });

    item.append(details, deleteButton);
    list.appendChild(item);
  });
}

const subcategoryForm = document.getElementById("subcategory-form");

if (subcategoryForm) {
  subcategoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const categorySelect = document.getElementById("subcategory-category");
    const nameInput = document.getElementById("subcategory-name");
    const message = document.getElementById("subcategory-message");

    const categoryId = categorySelect.value;
    const name = nameInput.value.trim();

    if (!categoryId || !name) {
      message.textContent = "Select a category and enter a subcategory name.";
      return;
    }

    message.textContent = "Saving subcategory...";

    const { error } = await supabase
      .from("portfolio_subcategories")
      .insert([{ category_id: categoryId, name }]);

    if (error) {
      message.textContent =
        error.code === "23505"
          ? "This subcategory already exists in that category."
          : "Could not save subcategory. Please try again.";

      console.error("Add subcategory failed:", error.message);
      return;
    }

    message.textContent = "Subcategory added successfully!";
    nameInput.value = "";

    await loadSubcategories();
  });
}


async function loadClients() {
  const list = document.getElementById("client-list");
  if (!list) return;

  const { data, error } = await supabase
    .from("portfolio_clients")
    .select("id, name, show_publicly")
    .order("name", { ascending: true });

  if (error) {
    list.textContent = "Could not load clients.";
    console.error("Load clients failed:", error.message);
    return;
  }

  list.replaceChildren();

  if (!data || data.length === 0) {
    list.textContent = "No clients added yet.";
    return;
  }

  data.forEach((client) => {
    const row = document.createElement("div");
    row.className = "project-row";

    const details = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = client.name;

    const visibility = document.createElement("p");
    visibility.textContent = client.show_publicly
      ? "Publicly visible"
      : "Private";
    visibility.style.color = "#42d9f5";
    visibility.style.fontSize = "13px";
    visibility.style.margin = "6px 0 0";

    details.append(name, visibility);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      if (!confirm(`Delete client "${client.name}"?`)) return;

      deleteButton.disabled = true;

      const { error: deleteError } = await supabase
        .from("portfolio_clients")
        .delete()
        .eq("id", client.id);

      if (deleteError) {
        console.error("Delete client failed:", deleteError.message);
        alert("Could not delete client. Please try again.");
        deleteButton.disabled = false;
        return;
      }

      await loadClients();
    });

    row.append(details, deleteButton);
    list.appendChild(row);
  });
}

const clientForm = document.getElementById("client-form");

if (clientForm) {
  clientForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = document.getElementById("client-name");
    const publicCheckbox = document.getElementById("client-public");
    const message = document.getElementById("client-message");

    const name = nameInput.value.trim();
    const showPublicly = publicCheckbox.checked;

    if (!name) {
      message.textContent = "Please enter a client name.";
      return;
    }

    message.textContent = "Saving client...";

    const { error } = await supabase
      .from("portfolio_clients")
      .insert([{ name, show_publicly: showPublicly }]);

    if (error) {
      console.error("Add client failed:", error.message);
      message.textContent =
        error.code === "23505"
          ? "Could not save this client."
          : "Could not save client. Check the browser console.";
      return;
    }

    message.textContent = "Client added successfully!";
    nameInput.value = "";
    publicCheckbox.checked = false;

    await loadClients();
  });
}

// BLUEART MARKETING — Load Customer Bookings
async function loadBookings() {
  const bookingsList = document.getElementById("bookings-list");
  const bookingsMessage = document.getElementById("bookings-message");

  if (!bookingsList || !bookingsMessage) return;

  bookingsList.textContent = "Loading bookings...";
  bookingsMessage.textContent = "";

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    bookingsList.textContent = "Could not load bookings.";
    bookingsMessage.textContent = error.message;
    bookingsMessage.style.color = "#ff8585";
    console.error("Bookings loading failed:", error.message);
    return;
  }

  allBookings = bookings || [];

  document.getElementById("pending-bookings-count").textContent =
    String(allBookings.filter((b) => b.status === "pending").length);

  document.getElementById("confirmed-bookings-count").textContent =
    String(allBookings.filter((b) => b.status === "confirmed").length);

  document.getElementById("total-bookings-count").textContent =
    String(allBookings.length);

  bookingsList.replaceChildren();

  if (allBookings.length === 0) {
    bookingsList.textContent = "No booking requests yet.";
    return;
  }

  allBookings.forEach((booking) => {
    const card = document.createElement("div");
    card.style.cssText =
      "padding:18px 0;border-bottom:1px solid #20334a;overflow-wrap:anywhere;";

    const title = document.createElement("h3");
    title.style.color = "#42d9f5";
    title.textContent = booking.customer_name;

    const details = document.createElement("p");
    details.style.cssText = "color:#b8c7d8;line-height:1.8;white-space:pre-wrap;";
    details.textContent =
      `Email: ${booking.customer_email}\n` +
      `Phone: ${booking.customer_phone || "Not provided"}\n` +
      `Service: ${booking.service}\n` +
      `Preferred date: ${booking.booking_date || "Not specified"}\n` +
      `Message: ${booking.message || "No details provided"}\n` +
      `Submitted: ${new Date(booking.created_at).toLocaleString()}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${booking.status}`;

    const statusSelect = document.createElement("select");
    statusSelect.setAttribute("aria-label", `Status for ${booking.customer_name}`);

    ["pending", "confirmed", "completed", "cancelled"].forEach((value) => {
      statusSelect.add(new Option(value, value));
    });

    statusSelect.value = booking.status;

    const updateButton = document.createElement("button");
    updateButton.type = "button";
    updateButton.textContent = "Update Status";
    updateButton.style.marginLeft = "10px";

    updateButton.addEventListener("click", async () => {
      updateButton.disabled = true;
      updateButton.textContent = "Updating...";

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: statusSelect.value })
        .eq("id", booking.id);

      if (updateError) {
        bookingsMessage.textContent = `Update failed: ${updateError.message}`;
        bookingsMessage.style.color = "#ff8585";
        updateButton.disabled = false;
        updateButton.textContent = "Update Status";
        return;
      }

      bookingsMessage.textContent = "Booking status updated successfully.";
      bookingsMessage.style.color = "#42d9f5";
      await loadBookings();
    });

    card.append(title, details, status, statusSelect, updateButton);
    bookingsList.appendChild(card);
  });
}

// BLUEART — Booking Search & Filter

function applyBookingFilters() {
  const searchInput = document.getElementById("booking-search");
  const statusFilter = document.getElementById("booking-status-filter");
  const bookingsList = document.getElementById("bookings-list");

  if (!searchInput || !statusFilter || !bookingsList) return;

  const searchText = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const bookingCards = Array.from(bookingsList.children).filter(
    (card) => card.id !== "booking-no-results"
  );

  bookingCards.forEach((card) => {
    const cardText = card.textContent.toLowerCase();
    const statusSelect = card.querySelector("select");

    const matchesSearch = cardText.includes(searchText);
    const matchesStatus =
      selectedStatus === "all" ||
      (statusSelect && statusSelect.value === selectedStatus);

    card.style.display =
      matchesSearch && matchesStatus ? "" : "none";
  });

  const visibleCount = bookingCards.filter(
    (card) => card.style.display !== "none"
  ).length;

  let noResults = document.getElementById("booking-no-results");

  if (!noResults) {
    noResults = document.createElement("p");
    noResults.id = "booking-no-results";
    noResults.textContent = "No bookings found.";
    noResults.style.color = "#8193a8";
    noResults.style.textAlign = "center";
    noResults.style.padding = "20px";
    bookingsList.insertAdjacentElement("afterend", noResults);
  }

  noResults.style.display = visibleCount === 0 ? "block" : "none";
}

document
  .getElementById("booking-search")
  ?.addEventListener("input", applyBookingFilters);

document
  .getElementById("booking-status-filter")
  ?.addEventListener("change", applyBookingFilters);
async function loadProjectDropdowns() {
  
  const categorySelect = document.getElementById("project-category");
  const subcategorySelect = document.getElementById("project-subcategory");
  const clientSelect = document.getElementById("project-client");

  if (!categorySelect || !subcategorySelect || !clientSelect) return;

  const { data: categories, error: categoryError } = await supabase
    .from("portfolio_categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  if (categoryError) {
    console.error("Project categories failed to load:", categoryError.message);
    return;
  }

  categorySelect.replaceChildren(new Option("Choose a category", ""));

  (categories || []).forEach((category) => {
    categorySelect.add(new Option(category.name, category.id));
  });

  const { data: clients, error: clientError } = await supabase
    .from("portfolio_clients")
    .select("id, name")
    .order("name", { ascending: true });

  if (clientError) {
    console.error("Project clients failed to load:", clientError.message);
    return;
  }

  clientSelect.replaceChildren(new Option("No client assigned", ""));

  (clients || []).forEach((client) => {
    clientSelect.add(new Option(client.name, client.id));
  });

  categorySelect.addEventListener("change", async () => {
    subcategorySelect.replaceChildren(
      new Option("No subcategory", "")
    );

    if (!categorySelect.value) return;

    const { data: subcategories, error: subcategoryError } = await supabase
      .from("portfolio_subcategories")
      .select("id, name")
      .eq("category_id", categorySelect.value)
      .order("sort_order", { ascending: true });

    if (subcategoryError) {
      console.error("Project subcategories failed to load:", subcategoryError.message);
      return;
    }

    (subcategories || []).forEach((subcategory) => {
      subcategorySelect.add(
        new Option(subcategory.name, subcategory.id)
      );
    });
  });
}

loadProjectDropdowns();


startDashboard();
