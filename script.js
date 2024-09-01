// Fetch player data from JSON (assuming hosted on GitHub Pages)
async function fetchPlayerData() {
    const response = await fetch('players.json');
    const data = await response.json();
    return data;
}

// Add or update player data in JSON file via GitHub API (for player management)
async function savePlayerData() {
    const playerData = {
        name: document.getElementById('name').value,
        serving: document.getElementById('serving').value,
        footwork: document.getElementById('footwork').value,
        smashing: document.getElementById('smashing').value,
        defense: document.getElementById('defense').value
    };

    const token = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN'; // GitHub API token
    const url = 'https://api.github.com/repos/YOUR_USERNAME/YOUR_REPOSITORY/contents/players.json';

    // Get current content and SHA
    const response = await fetch(url, {
        headers: { Authorization: `token ${token}` }
    });
    const file = await response.json();
    const content = atob(file.content);
    let json = JSON.parse(content);

    // Check if player exists, then update. Otherwise, add a new entry.
    const existingPlayerIndex = json.findIndex(player => player.name === playerData.name);
    if (existingPlayerIndex > -1) {
        json[existingPlayerIndex] = playerData;
    } else {
        json.push(playerData);
    }

    // Update content
    const updatedContent = btoa(JSON.stringify(json, null, 2));

    // Commit the new content to GitHub
    await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Update player data',
            content: updatedContent,
            sha: file.sha
        })
    });

    alert('Player data saved successfully!');
    updatePlayerList(); // Update the player selection list
}

// Event listener for saving player data
document.getElementById('ratingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    savePlayerData();
});

// Update player list in dropdown
async function updatePlayerList() {
    const players = await fetchPlayerData();
    const playerSelect = document.getElementById('playerSelect');
    playerSelect.innerHTML = ''; // Clear previous options
    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.name;
        option.text = player.name;
        playerSelect.appendChild(option);
    });
}

// Function to generate teams using OpenAI API
async function generateTeams() {
    const selectedPlayers = Array.from(document.getElementById('playerSelect').selectedOptions).map(option => option.value);
    const apiKey = document.getElementById('apiKey').value;

    if (!apiKey) {
        alert('Please enter your OpenAI API key.');
        return;
    }

    const playerData = await fetchPlayerData();
    const selectedPlayerData = playerData.filter(player => selectedPlayers.includes(player.name));

    const prompt = `
        Given the following players with their skill ratings in serving, footwork, smashing, and defense, form two balanced teams.
        ${JSON.stringify(selectedPlayerData)}
    `;

    const requestBody = {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 150,
    };

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        const teamsDiv = document.getElementById('teams');
        teamsDiv.innerHTML = `<h3>${data.choices[0].message.content}</h3>`;
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate teams. Please check your API key and try again.');
    }
}

// Initialize player list on load
updatePlayerList();
