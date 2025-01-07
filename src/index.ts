import { Application, Rectangle } from 'pixi.js';
import { Scene } from '../scenes/Scene'; // This is the import statement

const app = new Application<HTMLCanvasElement>({
    view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    backgroundColor: 0x6495ed,
    width: 640,
    height: 480
});

const sceny: Scene = new Scene(app.screen.width, app.screen.height);

app.stage.addChild(sceny);

// Ensure the stage is interactive and set the hitArea to cover the entire canvas
app.stage.interactive = true;
app.stage.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);

// Add event listener to the stage
app.stage.on("pointertap", sceny.onStageClick, sceny);
app.stage.eventMode = 'dynamic';