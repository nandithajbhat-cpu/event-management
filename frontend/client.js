// Client dashboard script
const API_BASE = 'https://event-management-tvkx.onrender.com/api';

// Authentication
function getToken() {
    return localStorage.getItem('token');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
}

// Check authentication
if (!getToken() || localStorage.getItem('role') !== 'client') {
    window.location.href = 'login.html';
}

// DOM elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const logoutBtn = document.getElementById('logoutBtn');
const searchQuery = document.getElementById('searchQuery');
const searchResults = document.getElementById('searchResults');
const myBookingsList = document.getElementById('myBookingsList');
const bookingSelect = document.getElementById('bookingSelect');
const generateQRBtn = document.getElementById('generateQRBtn');
const qrDisplay = document.getElementById('qrDisplay');
const totalEventsEl = document.getElementById('totalEvents');
const myBookingsEl = document.getElementById('myBookings');
const availableEventsList = document.getElementById('availableEventsList');
const feedbackForms = document.getElementById('feedbackForms');

// Global events data
let allEvents = [];
let myBookings = [];

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        if (section === 'logout') {
            logout();
        } else {
            showSection(section);
        }
    });
});

function showSection(sectionName) {
    sections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    // Load data
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'search-events':
            loadSearchEvents();
            break;
        case 'my-bookings':
            loadMyBookings();
            break;
        case 'qr-code':
            loadBookingSelect();
            break;
        case 'feedback':
            loadFeedbackForms();
            break;
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Fetch all events
        const eventsResponse = await fetch(`${API_BASE}/events`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        allEvents = await eventsResponse.json();
        totalEventsEl.textContent = allEvents.length;

        // Fetch my bookings
        const bookingsResponse = await fetch(`${API_BASE}/bookings/my`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        myBookings = await bookingsResponse.json();
        myBookingsEl.textContent = myBookings.length;

        // Render available events
        renderAvailableEvents();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Render available events on dashboard
function renderAvailableEvents() {
    availableEventsList.innerHTML = allEvents.slice(0, 5).map(event => `
        <li>
            <div class="event-main">
                <span class="event-name">${event.name}</span>
                <span class="event-meta">${event.date} • ${event.type}</span>
            </div>
            <button onclick="bookEvent(${event.id})">Book</button>
        </li>
    `).join('');
}

// Load search events
function loadSearchEvents() {
    // Events are already loaded in allEvents
    renderSearchResults(allEvents);
}

// Search events
searchQuery.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allEvents.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query)
    );
    renderSearchResults(filtered);
});

// Render search results
function renderSearchResults(events) {
    searchResults.innerHTML = events.map(event => `
        <div class="event-card">
            <h3>${event.name}</h3>
            <p>Date: ${event.date}</p>
            <p>Type: ${event.type}</p>
            <button onclick="bookEvent(${event.id})">Book Event</button>
        </div>
    `).join('');
}

// Book event
async function bookEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ event_id: eventId })
        });
        if (response.ok) {
            alert('Event booked successfully!');
            loadDashboard(); // Refresh data
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (error) {
        alert('Network error');
    }
}

// Load my bookings
async function loadMyBookings() {
    try {
        const response = await fetch(`${API_BASE}/bookings/my`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        myBookings = await response.json();
        myBookingsList.innerHTML = myBookings.map(booking => `
            <li>
                <div>
                    <strong>${booking.event_name}</strong><br>
                    Date: ${booking.date} | Type: ${booking.type}<br>
                    Booking ID: ${booking.id}
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Load booking select for QR
async function loadBookingSelect() {
    try {
        const response = await fetch(`${API_BASE}/bookings/my`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        myBookings = await response.json();
        bookingSelect.innerHTML = '<option value="">Select Booking</option>' +
            myBookings.map(booking => `<option value="${booking.id}">${booking.event_name} - ${booking.date}</option>`).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Generate QR
generateQRBtn.addEventListener('click', async () => {
    const bookingId = bookingSelect.value;
    if (!bookingId) {
        alert('Please select a booking');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/qr/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        qrDisplay.innerHTML = `<img src="${data.qr_code}" alt="QR Code" style="max-width: 200px;">`;
    } catch (error) {
        console.error('Error generating QR:', error);
    }
});

// Load feedback forms
async function loadFeedbackForms() {
    try {
        const response = await fetch(`${API_BASE}/bookings/my`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        myBookings = await response.json();
        feedbackForms.innerHTML = myBookings.map(booking => `
            <div class="feedback-form" style="margin-bottom: 2rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px;">
                <h3>${booking.event_name}</h3>
                <p>Date: ${booking.date}</p>
                <label>Rating (1-5): <input type="number" min="1" max="5" id="rating-${booking.id}" required></label><br>
                <label>Comment: <textarea id="comment-${booking.id}" rows="3" style="width: 100%; margin: 0.5rem 0;"></textarea></label><br>
                <button onclick="submitFeedback(${booking.id})" class="btn primary-btn">Submit Feedback</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading feedback forms:', error);
    }
}

// Submit feedback
async function submitFeedback(eventId) {
    const rating = document.getElementById(`rating-${eventId}`).value;
    const comment = document.getElementById(`comment-${eventId}`).value;
    if (!rating || rating < 1 || rating > 5) {
        alert('Please provide a rating between 1 and 5');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ event_id: eventId, rating: parseInt(rating), comment })
        });
        if (response.ok) {
            alert('Feedback submitted successfully!');
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (error) {
        alert('Network error');
    }
}

// Logout
logoutBtn.addEventListener('click', logout);

// Initial load
loadDashboard();