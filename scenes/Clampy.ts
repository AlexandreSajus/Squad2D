import { Sprite, Texture } from 'pixi.js';

export class Clampy extends Sprite {
    public selected: boolean;
    public targetX: number;
    public targetY: number;
    public speed: number = 0.5;
    public enemy: boolean = false;
    public otherClampys: Clampy[] = [];
    public health: number = 100;

    constructor(texture: Texture) {
        super(texture);
        this.selected = false;
        this.targetX = this.x;
        this.targetY = this.y;
        this.anchor.set(0.5);
        this.eventMode = 'dynamic';
        this.on("pointertap", this.onClicky, this);
    }

    private onClicky(): void {
        this.selected = !this.selected;
        this.texture = this.selected ? Texture.from("inf_selected.png") : Texture.from("inf.png");
    }
}