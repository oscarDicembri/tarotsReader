import Phaser from "phaser";

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#34495e',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    console.log("Assets loaded!");
}

function create() {
    console.log("Game Created!")
    this.add.text(400, 300, 'Tarots Reader Online', {fontsize: '32px', fill: '#fff'}).setOrigin(0.5);
}

function update() {

}