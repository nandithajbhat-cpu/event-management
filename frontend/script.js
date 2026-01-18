// Authentication functions
function getToken() {
    return localStorage.getItem('token');
}

function getUserRole() {
    return localStorage.getItem('role');
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
}

// Check authentication on page load
if (!isLoggedIn() || getUserRole() !== 'organizer') {
    window.location.href = 'login.html';
}

// API base URL
const API_BASE = 'https://event-management-tvkx.onrender.com/api';

// Sample data for events (will be replaced with API)
let events = [];
let activity = [
    "New inquiry received for Wedding – 200 guests.",
    "Client confirmed booking for Tech Innovation Summit.",
    "Vendor payment marked as completed.",
    "Venue inspection scheduled for Winter Music Concert."
];

// DOM elements
const eventsList = document.getElementById("eventsList");
const eventsCountBadge = document.getElementById("eventsCountBadge");
const addSampleEventBtn = document.getElementById("addSampleEventBtn");
const clearEventsBtn = document.getElementById("clearEventsBtn");
const eventForm = document.getElementById("eventForm");
const eventNameInput = document.getElementById("eventName");
const eventDateInput = document.getElementById("eventDate");
const eventTypeSelect = document.getElementById("eventType");
const formMessage = document.getElementById("formMessage");
const activityList = document.getElementById("activityList");
const themeToggle = document.getElementById("themeToggle");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");

// Stats elements
const totalEventsEl = document.getElementById("totalEvents");
const upcomingEventsEl = document.getElementById("upcomingEvents");
const confirmedBookingsEl = document.getElementById("confirmedBookings");
const pendingInquiriesEl = document.getElementById("pendingInquiries");

// Section elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.id.replace('-link', '');
        showSection(target);
    });
});

function showSection(sectionName) {
    sections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    // Load data for the section
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'upcoming-events':
            loadUpcomingEvents();
            break;
        case 'bookings':
            loadAllBookings();
            break;
        case 'clients':
            loadClients();
            break;
        case 'vendors':
            loadVendors();
            break;
        case 'feedback':
            loadAllFeedback();
            break;
        case 'settings':
            // No load needed
            break;
    }
}

// Fetch events from API
async function fetchEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        if (response.ok) {
            events = await response.json();
            renderEvents();
        } else {
            console.error('Failed to fetch events');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

// Render events to the list
function renderEvents() {
    eventsList.innerHTML = "";
    events.forEach((event) => {
        const li = document.createElement("li");

        const main = document.createElement("div");
        main.className = "event-main";

        const title = document.createElement("span");
        title.className = "event-name";
        title.textContent = event.name;

        const meta = document.createElement("span");
        meta.className = "event-meta";
        meta.textContent = `${event.date} • ${event.type}`;

        main.appendChild(title);
        main.appendChild(meta);

        const tag = document.createElement("span");
        tag.className = "event-tag";
        tag.textContent = "Upcoming";

        li.appendChild(main);
        li.appendChild(tag);
        eventsList.appendChild(li);
    });

    eventsCountBadge.textContent = events.length;
    totalEventsEl.textContent = events.length;
    upcomingEventsEl.textContent = events.length;
}

// Fetch events from API
async function fetchEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (response.ok) {
            events = await response.json();
            renderEvents();
        } else {
            console.error('Failed to fetch events');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

// Load dashboard data
async function loadDashboard() {
    await fetchEvents();
    await loadStats();
    renderActivity();
}

// Load upcoming events
async function loadUpcomingEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const allEvents = await response.json();
        const upcomingEvents = allEvents.filter(event => new Date(event.date) > new Date());
        const list = document.getElementById('upcomingEventsList');
        list.innerHTML = upcomingEvents.map(event => `
            <li>
                <div class="event-main">
                    <span class="event-name">${event.name}</span>
                    <span class="event-meta">${event.date} • ${event.type}</span>
                </div>
                <button onclick="deleteEvent(${event.id})" class="btn small-btn">Delete</button>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading upcoming events:', error);
    }
}

// Load all bookings
async function loadAllBookings() {
    try {
        const response = await fetch(`${API_BASE}/bookings/all`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const bookings = await response.json();
        const list = document.getElementById('allBookingsList');
        list.innerHTML = bookings.map(booking => `
            <li>
                <div>
                    <strong>${booking.client_name}</strong> - ${booking.event_name}<br>
                    Date: ${booking.date} | Type: ${booking.type}<br>
                    Booking ID: ${booking.id}
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Load clients
async function loadClients() {
    try {
        const response = await fetch(`${API_BASE}/auth/clients`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const clients = await response.json();
        const list = document.getElementById('clientsList');
        list.innerHTML = clients.map(client => `
            <li>
                <div>
                    <strong>${client.name}</strong><br>
                    Email: ${client.email}<br>
                    Bookings: ${client.booking_count}
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

// Load vendors
async function loadVendors() {
    try {
        const response = await fetch(`${API_BASE}/vendors`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const vendors = await response.json();
        const list = document.getElementById('vendorsList');
        list.innerHTML = vendors.map(vendor => `
            <li>
                <div>
                    <strong>${vendor.name}</strong><br>
                    Service: ${vendor.service_type}<br>
                    Contact: ${vendor.contact}
                </div>
                <button onclick="deleteVendor(${vendor.id})" class="btn small-btn">Delete</button>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading vendors:', error);
    }
}

// Delete event
async function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            const response = await fetch(`${API_BASE}/events/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (response.ok) {
                loadUpcomingEvents();
                loadDashboard();
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    }
}

// Load all feedback
async function loadAllFeedback() {
    try {
        const response = await fetch(`${API_BASE}/feedback/all`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const feedback = await response.json();
        const list = document.getElementById('feedbackList');
        list.innerHTML = feedback.map(f => `
            <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px;">
                <h3>${f.event_name}</h3>
                <p><strong>Client:</strong> ${f.client_name} (${f.email})</p>
                <p><strong>Rating:</strong> ${f.rating}/5</p>
                <p><strong>Comment:</strong> ${f.comment || 'No comment'}</p>
                <p><strong>Date:</strong> ${new Date(f.created_at).toLocaleDateString()}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

// Render activity list
function renderActivity() {
    activityList.innerHTML = "";
    activity.forEach((text, index) => {
        const li = document.createElement("li");

        const mainText = document.createElement("span");
        mainText.textContent = text;

        const time = document.createElement("span");
        time.className = "activity-item-time";
        time.textContent = index === 0 ? "Just now" : `${index}h ago`;

        li.appendChild(mainText);
        li.appendChild(document.createTextNode(" "));
        li.appendChild(time);
        activityList.appendChild(li);
    });
}

// Add new event from form
eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = eventNameInput.value.trim();
    const date = eventDateInput.value;
    const type = eventTypeSelect.value;

    if (!name || !date) {
        formMessage.textContent = "Please fill all required fields.";
        formMessage.style.color = "var(--danger)";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name, date, type })
        });

        if (response.ok) {
            formMessage.textContent = "Event added successfully!";
            formMessage.style.color = "var(--accent)";
            eventForm.reset();
            fetchEvents(); // Refresh events list
        } else {
            const error = await response.json();
            formMessage.textContent = error.message || "Error adding event.";
            formMessage.style.color = "var(--danger)";
        }
    } catch (error) {
        formMessage.textContent = "Network error.";
        formMessage.style.color = "var(--danger)";
    }

    setTimeout(() => (formMessage.textContent = ""), 2000);
});

// Logout button
const logoutBtn = document.getElementById("logoutBtn");
const logoutBtn2 = document.getElementById("logoutBtn2");
logoutBtn.addEventListener("click", logout);
logoutBtn2.addEventListener("click", logout);

// Add vendor button
const addVendorBtn = document.getElementById("addVendorBtn");
addVendorBtn.addEventListener("click", () => {
    const name = prompt('Vendor Name:');
    const service_type = prompt('Service Type:');
    const contact = prompt('Contact:');
    if (name && service_type && contact) {
        addVendor(name, service_type, contact);
    }
});

async function addVendor(name, service_type, contact) {
    try {
        const response = await fetch(`${API_BASE}/vendors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name, service_type, contact })
        });
        if (response.ok) {
            loadVendors();
        }
    } catch (error) {
        console.error('Error adding vendor:', error);
    }
}

// Add sample event button (modified to add via API)
addSampleEventBtn.addEventListener("click", async () => {
    const sampleEvent = {
        name: "Sample Event " + (events.length + 1),
        date: "2026-02-01",
        type: "Workshop"
    };

    try {
        const response = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(sampleEvent)
        });

        if (response.ok) {
            fetchEvents();
        }
    } catch (error) {
        console.error('Error adding sample event:', error);
    }
});

// Clear events button (remove for now, or implement delete all)
clearEventsBtn.style.display = 'none';

// Dark mode toggle
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// Mobile sidebar toggle
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

// Set a default random pending inquiries number
pendingInquiriesEl.textContent = 5 + Math.floor(Math.random() * 4);

// Initial render
showSection('dashboard');
