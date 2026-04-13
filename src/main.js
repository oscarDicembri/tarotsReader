import Phaser from 'phaser';

// CONFIGURATION
const config = {
    type: Phaser.AUTO,
    // window.innerWidth e innerHeight prendono lo spazio disponibile nel browser
    width: window.innerWidth, 
    height: window.innerHeight,
    backgroundColor: '#1a1a1a',
    scale: {
        mode: Phaser.Scale.RESIZE, // Il gioco si ridimensiona con il browser
        autoCenter: Phaser.Scale.CENTER_BOTH // Mantiene il canvas centrato
    },
    scene: {
        create: create
    }
};

const game = new Phaser.Game(config);

// GLOBAL STATE
let gameState = {
    deck: [],
    selectedCards: [],
    isReadingReady: false
};

// HELPER: Fetch 5 random cards
async function fetchSpread() {
    // Chiediamo 5 carte invece di 1
    const response = await fetch('https://tarotapi.dev/api/v1/cards/random?n=5');
    const data = await response.json();
    return data.cards;
}

function create() {
    // 1. UI: Intro Text
    const introText = this.add.text(512, 300, 'Ask anything to the cards in your mind...', { 
        fontSize: '32px', 
        fill: '#ecf0f1',
        fontFamily: 'Georgia'
    }).setOrigin(0.5);

    // 2. UI: "I'm ready" Button (Placeholder testuale cliccabile)
    const readyButton = this.add.text(512, 450, "I'm ready", { 
        fontSize: '24px', 
        fill: '#d4af37',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    // EVENT: Quando l'utente è pronto
    readyButton.on('pointerdown', async () => {
        readyButton.setVisible(false);
        introText.setText('Shuffling the deck...');

        try {
            const cards = await fetchSpread();
            gameState.deck = cards;
            introText.setText('Select a card to reveal your destiny');
            
            // Per ora stampiamo in console per vedere se le 5 carte arrivano
            console.log("Deck loaded:", gameState.deck);
            
            // QUI andrà la logica per mostrare le 5 carte sul tavolo
            displayTable(this);
            
        } catch (error) {
            introText.setText('The spirits are silent. Check your connection.');
        }
    });
}

function displayTable(scene) {
    const centerX = scene.cameras.main.centerX;
    const centerY = scene.cameras.main.centerY;
    const offset = 180; // Distanza tra le carte

    // Definiamo le posizioni della "Croce"
    const spreadPositions = [
        { x: centerX,          y: centerY,          label: "Present" },  // Card 0
        { x: centerX - offset, y: centerY,          label: "Past" },     // Card 1
        { x: centerX + offset, y: centerY,          label: "Future" },   // Card 2
        { x: centerX,          y: centerY + offset, label: "Reason" },   // Card 3
        { x: centerX,          y: centerY - offset, label: "Outcome" }   // Card 4
    ];

    gameState.deck.forEach((cardData, index) => {
        const pos = spreadPositions[index];
        
        // Per ora creiamo un rettangolo grigio come segnaposto per la carta
        const cardBack = scene.add.rectangle(pos.x, pos.y, 100, 140, 0x333333)
            .setStrokeStyle(2, 0xd4af37)
            .setInteractive({ useHandCursor: true });

        // Aggiungiamo un testo temporaneo sopra
        scene.add.text(pos.x, pos.y + 80, pos.label, { fontSize: '14px', fill: '#d4af37' }).setOrigin(0.5);

        // Evento click sulla carta
        cardBack.on('pointerdown', () => {
            console.log(`You clicked the ${pos.label} card: ${cardData.name}`);
            // Qui chiameremo la funzione per mostrare il dettaglio
            showCardDetail(scene, cardData, pos.label);
        });
    });
}

function showCardDetail(scene, cardData, positionLabel) {
    const { centerX, centerY, width, height } = scene.cameras.main;
    const gap = 20; // Spazio tra i blocchi di testo

    // 1. DIMMER (Nero trasparente)
    const dimmer = scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0.8)
        .setAlpha(0).setInteractive();

    // 2. CARTA (Placeholder grande)
    const detailCard = scene.add.rectangle(centerX, centerY, 200, 280, 0x333333)
        .setStrokeStyle(3, 0xd4af37);

    // 3. CREAZIONE TESTI (Senza posizione definitiva ancora)
    // Li mettiamo a X molto lontana per ora, ci serve solo misurarli
    const textX = centerX + 100;

    const title = scene.add.text(textX, 0, cardData.name.toUpperCase(), {
        fontSize: '32px', fontFamily: 'Georgia', fill: '#d4af37',
        wordWrap: { width: 350 }, align: 'left'
    }).setAlpha(0);

    const description = scene.add.text(textX, 0, cardData.meaning_up, {
        fontSize: '18px', fontFamily: 'Arial', fill: '#ffffff',
        wordWrap: { width: 350 }, align: 'left'
    }).setAlpha(0);

    const interpretation = scene.add.text(textX, 0, `- ${cardData.name} symbolizes your ${positionLabel.toLowerCase()}`, {
        fontSize: '16px', fontStyle: 'italic', fill: '#ecf0f1',
        wordWrap: { width: 350 }, align: 'left'
    }).setAlpha(0);

    // 4. CALCOLO ALTEZZA TOTALE (L'algoritmo di impilamento)
    const totalHeight = title.height + description.height + interpretation.height + (gap * 2);
    
    // Punto di inizio per centrare il blocco verticalmente
    let currentY = centerY - (totalHeight / 2);

    // Assegniamo le Y finali in sequenza
    title.y = currentY;
    currentY += title.height + gap;

    description.y = currentY;
    currentY += description.height + gap;

    interpretation.y = currentY;

    // 5. ANIMAZIONI (Tweens)
    scene.tweens.add({ targets: dimmer, alpha: 1, duration: 400 });

    scene.tweens.add({
        targets: detailCard,
        x: centerX - 220,
        scale: 1.5,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            scene.tweens.add({
                targets: [title, description, interpretation],
                alpha: 1,
                duration: 400
            });
        }
    });

    dimmer.once('pointerdown', () => {
        [dimmer, detailCard, title, description, interpretation].forEach(obj => obj.destroy());
    });
}