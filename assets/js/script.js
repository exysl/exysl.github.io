const categories = {
    "IPA": ["Fisika", "Biologi", "Kimia"],
    "IPS": ["Sosiologi", "Geografi", "Ekonomi", "Sejarah"],
    "Bahasa": ["Bahasa Indonesia", "Bahasa Jawa", "Bahasa Inggris"],
    "Mapel": ["Informatika (TIK)", "Matematika", "Pendidikan Seni (Senbud)", "PAI", "PPKn", "BK"]
};

// Theme Management
function toggleTheme() {
    const body = document.body;
    body.getAttribute('data-theme') === 'dark' 
        ? body.removeAttribute('data-theme')
        : body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', body.getAttribute('data-theme') || 'light');
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.body.setAttribute('data-theme', 'dark');
}

// Content Management
function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `<h2>${category}</h2>`;
    card.addEventListener('click', () => showSubjects(category));
    return card;
}

let currentView = 'main'; // 'main', 'category', 'subject'
let lastCategory = '';

function showSubjects(category) {
    currentView = 'category';
    lastCategory = category; // Store the last category
    const mainGrid = document.getElementById('mainGrid');
    mainGrid.innerHTML = '';
    
    categories[category].forEach(subject => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'subject-item';
        subjectDiv.textContent = subject;
        subjectDiv.addEventListener('click', () => openSubject(category, subject));
        mainGrid.appendChild(subjectDiv);
    });

    updateUIState(); // Update UI state to show the back button
}

function openSubject(category, subject) {
    currentView = 'subject';
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="header">
            <h1>${subject}</h1>
            <p>Category: ${category}</p>
        </div>
        <div class="content">
            <p>Homework content for ${subject} will be displayed here.</p>
        </div>
    `;
    
    updateUIState(category); // Pass the category to update the back button correctly
}

function updateUIState(category = null) {
    const backBtn = document.querySelector('.back-button');
    const floatingBtn = document.querySelector('.floating-submit-btn');

    if (currentView === 'main') {
        backBtn.style.display = 'none';
        floatingBtn.style.display = 'block';
    } else {
        backBtn.style.display = 'block';
        floatingBtn.style.display = 'none';
    }

    // Dynamically update back button behavior
    backBtn.onclick = () => {
        if (currentView === 'subject' && category) {
            showSubjects(category); // Go back to category view
        } else {
            showMain(); // Go back to main grid
        }
    };
}

function openSubject(category, subject) {
    currentView = 'subject';
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="header">
            <h1>${subject}</h1>
            <p>Category: ${category}</p>
        </div>
        <div class="content">
            <p>Homework content for ${subject} will be displayed here.</p>
        </div>
    `;
    
    updateUIState(category); // Now passes category correctly
}


function showMain() {
    currentView = 'main';
    const mainGrid = document.getElementById('mainGrid');
    mainGrid.innerHTML = '';
    Object.keys(categories).forEach(category => {
        mainGrid.appendChild(createCategoryCard(category));
    });
    updateUIState();
}

function updateUIState(category = null) {
    const backBtn = document.querySelector('.back-button');
    const floatingBtn = document.querySelector('.floating-submit-btn');

    if (currentView === 'main') {
        backBtn.style.display = 'none';
        floatingBtn.style.display = 'block';
    } else {
        backBtn.style.display = 'block';
        floatingBtn.style.display = 'none';
    }

    // Dynamically update back button behavior
    backBtn.onclick = () => {
        if (currentView === 'subject' && category) {
            showSubjects(category); // Go back to category view
        } else {
            showMain(); // Go back to main grid
        }
    };
}



// Submission System
function populateSubjectSelect() {
    const select = document.getElementById('subjectSelect');
    Object.entries(categories).forEach(([category, subjects]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = `${category}/${subject}`;
            option.textContent = subject;
            optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
    });
}

function setCurrentDate() {
    const dateInput = document.getElementById('submissionDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

async function handleSubmission(e) {
    e.preventDefault();
    
    const subjectPath = document.getElementById('subjectSelect').value;
    const date = document.getElementById('submissionDate').value;
    const comments = document.getElementById('submissionComments').value;
    const files = Array.from(document.getElementById('submissionFiles').files);

    if (!subjectPath || !date || !comments) {
        showFeedback('❌ Please fill all required fields', 'error');
        return;
    }

    const submitBtn = document.querySelector('#submissionForm button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loader"></div> Submitting...';

    try {
        const content = `## Homework Submission\n\n**Date:** ${date}\n\n**Comments:**\n${comments}\n\n**Attachments:**\n$` +
            files.map(f => `- [${f.name}](${f.name})`).join('\n');

        const response = await fetch(
            `https://api.github.com/repos/exysl/exysl.github.io/contents/subjects/${subjectPath}/${Date.now()}.md`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': 'token YOUR_GITHUB_TOKEN',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `New submission: ${subjectPath}`,
                    content: btoa(content),
                    branch: 'main'
                })
            }
        );

        const data = await response.json();
        
        if (response.ok) {
            showFeedback('✅ Submission successful! File created', 'success');
            document.getElementById('submissionForm').reset();
            toggleSubmissionForm();
        } else {
            throw new Error(data.message || 'Submission failed');
        }
    } catch (error) {
        showFeedback(`❌ Error: ${error.message}`, 'error');
        console.error('Submission error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Homework';
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    showMain();
    populateSubjectSelect();
    setCurrentDate();
    document.getElementById('submissionForm').addEventListener('submit', handleSubmission);
});

function toggleSubmissionForm() {
    const overlay = document.getElementById('submissionOverlay');
    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
}

function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}

