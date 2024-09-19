// // Fetch player data from JSON (assuming hosted on GitHub Pages)
// const firebaseConfig = {
//     apiKey: process.env.FIREBASE_API_KEY,
//     // authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     // storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.FIREBASE_APP_ID,
//   };
  
// firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

function loadFirebaseConfig() {
  const db = firebase.firestore();
  
  // Fetch Firebase config from Firestore
  return db.collection('config').doc('firebaseConfig').get().then((doc) => {
    if (doc.exists) {
      const config = doc.data();
      
      // Initialize Firebase with the fetched config
      firebase.initializeApp(config);
      console.log("Firebase initialized with dynamic config:", config);
    } else {
      console.error("No Firebase config found in Firestore");
    }
  }).catch((error) => {
    console.error("Error fetching Firebase config: ", error);
  });
}

// Load existing players into the dropdown
function loadExistingPlayers() {
  const playerSelect = document.getElementById('existing-player-select');

  // Clear any existing options except the default one
  playerSelect.innerHTML = '<option value="">--Select Player--</option>';

  db.collection('players').get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const playerData = doc.data();
        const option = document.createElement('option');
        option.value = playerData.name;
        option.textContent = playerData.name;
        playerSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error("Error fetching players: ", error);
    });
}

// Function to calculate the average of two numbers
function calculateAverage(oldRating, newRating) {
  return (oldRating + newRating) / 2;
}

// Function to save or update player data with averaged skillset ratings
function savePlayerData(name, attack, defense, speed, stamina, teamplay) {
  const playersRef = db.collection('players');

  // Check if the player already exists by name
  playersRef.where('name', '==', name).get()
    .then(querySnapshot => {
      if (!querySnapshot.empty) {
        // Player exists, update the existing player with new average ratings
        querySnapshot.forEach(doc => {
          const playerData = doc.data();

          // Calculate the new average ratings for each skillset
          const updatedAttack = calculateAverage(playerData.attack, attack);
          const updatedDefense = calculateAverage(playerData.defense, defense);
          const updatedSpeed = calculateAverage(playerData.speed, speed);
          const updatedStamina = calculateAverage(playerData.stamina, stamina);
          const updatedTeamPlay = calculateAverage(playerData.teamplay, teamplay);

          // Update the player document with new averaged ratings
          playersRef.doc(doc.id).update({
            attack: updatedAttack,
            defense: updatedDefense,
            speed: updatedSpeed,
            stamina: updatedStamina,
            teamplay: updatedTeamPlay,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(() => {
            alert("Player data updated successfully!");
          })
          .catch(error => {
            console.error("Error updating player: ", error);
          });
        });
      } else {
        // Player does not exist, add new player data
        playersRef.add({
          name: name,
          attack: attack,
          defense: defense,
          speed: speed,
          stamina: stamina,
          teamplay: teamplay,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          alert("Player data saved successfully!");
        })
        .catch(error => {
          console.error("Error adding player: ", error);
        });
      }
    })
    .catch(error => {
      console.error("Error fetching player data: ", error);
    });
}

// Event listener for selecting an existing player
document.getElementById('existing-player-select').addEventListener('change', (event) => {
  const playerNameInput = document.getElementById('player-name');
  if (event.target.value) {
    playerNameInput.value = event.target.value;
    playerNameInput.disabled = true; // Disable input if existing player selected
  } else {
    playerNameInput.value = '';
    playerNameInput.disabled = false; // Enable input if no player selected
  }
});

// By default, show the Add and Rate Player section when the page loads
window.onload = () => {
  showSection('add-and-rate-player-section');
};

// Function to fetch player data from Firestore
function fetchPlayerData() {
db.collection('players').orderBy('name', 'asc').get()
    .then(querySnapshot => {
    querySnapshot.forEach(doc => {
        const player = doc.data();
        console.log(`Player: ${player.name}, Rating: ${player.rating || 'Not rated yet'}`);
        // Optionally, render player data in HTML
    });
    })
    .catch(error => {
    console.error('Error fetching player data:', error);
    });
}

// Fetch and display player data
fetchPlayerData();

// Add event listeners for navigation buttons
document.getElementById('add-rate-btn').addEventListener('click', () => {
    showSection('player-form');
});
  
document.getElementById('team-formation-btn').addEventListener('click', () => {
    showSection('team-formation-section');
});

// Function to get the selected rating for a skill
function getSelectedRating(skillsetId) {
  const ratings = document.getElementsByName(skillsetId);
  for (let rating of ratings) {
    if (rating.checked) {
      return parseInt(rating.value, 10);
    }
  }
  return null;
}

// Event listener for submitting player data
document.getElementById('submit').addEventListener('click', () => {
  const playerName = document.getElementById('player-name').value;
  const attackRating = getSelectedRating('attack');
  const defenseRating = getSelectedRating('defense');
  const agilityRating = getSelectedRating('agility');
  const servingRating = getSelectedRating('serving');
  const teamplayRating = getSelectedRating('teamplay');

  if (playerName && attackRating && defenseRating && agilityRating && servingRating && teamplayRating) {
    savePlayerData(playerName, attackRating, defenseRating, agilityRating, servingRating, teamplayRating);
  } else {
    alert("Please rate all skillsets.");
  }
});

// Load team formation section only after master password is entered
document.getElementById('password-submit-btn').addEventListener('click', () => {
  const enteredPassword = document.getElementById('master-password').value;

  // Check the master password stored in the database
  db.collection('config').doc('masterPassword').get()
    .then(doc => {
      if (doc.exists && doc.data().password === enteredPassword) {
        document.getElementById('password-prompt').style.display = 'none';
        document.getElementById('team-formation-content').style.display = 'block';
        loadRatedPlayers();
      } else {
        alert("Incorrect master password");
      }
    })
    .catch(error => {
      console.error("Error fetching master password: ", error);
    });
});

// Load the list of rated players from the database
function loadRatedPlayers() {
  const playersList = document.getElementById('players-list');
  playersList.innerHTML = ''; // Clear the list before adding players

  db.collection('players').get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const player = doc.data();
        const li = document.createElement('li');
        li.textContent = player.name;
        li.setAttribute('data-player-id', doc.id);
        li.addEventListener('click', () => selectPlayer(player));
        playersList.appendChild(li);
      });
    })
    .catch(error => {
      console.error("Error loading players: ", error);
    });
}

// Selected players for team formation
const selectedPlayers = [];

// Add selected player to the team formation section
function selectPlayer(player) {
  if (selectedPlayers.length < 2) {
    selectedPlayers.push(player);
    const selectedList = document.getElementById('selected-players');
    const li = document.createElement('li');
    li.textContent = player.name;
    selectedList.appendChild(li);
  }

  if (selectedPlayers.length === 2) {
    document.getElementById('generate-teams-btn').style.display = 'block'; // Show generate team button
  }
}

// Prompt for ChatGPT API key and generate the team
document.getElementById('generate-teams-btn').addEventListener('click', () => {
  const apiKey = prompt("Enter ChatGPT API key");

  if (apiKey && selectedPlayers.length === 2) {
    // Prepare data for team formation
    const playerData = selectedPlayers.map(player => ({
      name: player.name,
      attack: player.attack,
      defense: player.defense,
      speed: player.speed,
      stamina: player.stamina,
      teamplay: player.teamplay
    }));

    // Make API call to ChatGPT to form a team
    fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a coach that forms balanced badminton teams."
          },
          {
            role: "user",
            content: `Form a team of 2 players based on their skillset: ${JSON.stringify(playerData)}`
          }
        ]
      })
    })
    .then(response => response.json())
    .then(data => {
      alert(`ChatGPT Team: ${data.choices[0].message.content}`);
    })
    .catch(error => {
      console.error("Error generating team: ", error);
      alert("Error generating team. Please check your API key.");
    });
  } else {
    alert("Please select two players and provide the API key.");
  }
});

// Helper function to generate the star rating HTML
function getStarRatingHTML(skillset) {
  return `
    <input type="radio" id="${skillset}-star5" name="${skillset}" value="5" /><label for="${skillset}-star5"></label>
    <input type="radio" id="${skillset}-star4" name="${skillset}" value="4" /><label for="${skillset}-star4"></label>
    <input type="radio" id="${skillset}-star3" name="${skillset}" value="3" /><label for="${skillset}-star3"></label>
    <input type="radio" id="${skillset}-star2" name="${skillset}" value="2" /><label for="${skillset}-star2"></label>
    <input type="radio" id="${skillset}-star1" name="${skillset}" value="1" /><label for="${skillset}-star1"></label>
  `;
}
