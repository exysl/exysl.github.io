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

function showSubjects(category) {
    const mainGrid = document.getElementById('mainGrid');
    mainGrid.innerHTML = '';
    
    categories[category].forEach(subject => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'subject-item';
        subjectDiv.textContent = subject;
        subjectDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            openSubject(category, subject);
        });
        mainGrid.appendChild(subjectDiv);
    });

    document.querySelector('.back-button').style.display = 'block';
    document.querySelector('.header p').textContent = `Showing subjects for: ${category}`;
}

function openSubject(category, subject) {
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
    document.querySelector('.back-button').style.display = 'block';
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

// Modified submission handler
async function handleSubmission(e) {
    e.preventDefault();
    
    const subjectPath = document.getElementById('subjectSelect').value;
    const date = document.getElementById('submissionDate').value;
    const comments = document.getElementById('submissionComments').value;
    const files = Array.from(document.getElementById('submissionFiles').files);

    // Validate required fields
    if (!subjectPath || !date || !comments) {
        showFeedback('❌ Please fill all required fields', 'error');
        return;
    }

    const submitBtn = document.querySelector('#submissionForm button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loader"></div> Submitting...';

    try {
        // Create file content
        const attachments = [];
        for (const file of files) {
            const url = await uploadFile(file);
            attachments.push(`- [${file.name}](${url})`);
        }

        const content = `## Homework Submission\n\n**Date:** ${date}\n\n**Comments:**\n${comments}\n\n**Attachments:**\n${attachments.join('\n')}`;

        // Use proxy server for GitHub API
        const response = await fetch('https://your-proxy-service.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subjectPath,
                content: btoa(
                    encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (_, p1) => 
                        String.fromCharCode(parseInt(p1, 16))
                    )
                ),
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            showFeedback('✅ Submission successful! PR #' + result.pr_number, 'success');
            document.getElementById('submissionForm').reset();
            toggleSubmissionForm();
        } else {
            throw new Error(result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showFeedback(`❌ Error: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Homework';
    }
}

async function createPullRequest(subjectPath, content) {
    const filename = `subjects/${subjectPath}/${Date.now()}_submission.md`;
    
    return fetch(`https://api.github.com/repos/exysl/exysl.github.io/contents/${filename}`, {
        method: 'PUT',
        headers: {
            'Authorization': 'token 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', // Replace with actual token
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `New submission for ${subjectPath}`,
            content: btoa(content),
            branch: 'submissions'
        })
    });
}

async function uploadFile(file) {
    // Implement actual file upload logic here
    return URL.createObjectURL(file);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    const mainGrid = document.getElementById('mainGrid');
    Object.keys(categories).forEach(category => {
        mainGrid.appendChild(createCategoryCard(category));
    });
    populateSubjectSelect();
    setCurrentDate();
    document.getElementById('submissionForm').addEventListener('submit', handleSubmission);
});

function showMain() {
    const mainGrid = document.getElementById('mainGrid');
    mainGrid.innerHTML = '';
    Object.keys(categories).forEach(category => {
        mainGrid.appendChild(createCategoryCard(category));
    });
    document.querySelector('.back-button').style.display = 'none';
    document.querySelector('.header p').textContent = 'Select a category to view subjects';
}

function toggleSubmissionForm() {
    const overlay = document.getElementById('submissionOverlay');
    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
}

// Visual feedback system
function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}