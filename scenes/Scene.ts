import { Container, Ticker, FederatedPointerEvent, Texture, Graphics } from 'pixi.js';
import { Clampy } from './Clampy';
import { Tile, TileType } from './Tile';
import mapData from '../assets/map.json';

export class Scene extends Container {
    private readonly screenWidth: number;
    private readonly screenHeight: number;
    private clampys: Clampy[] = [];
    private healthBars: Graphics[] = [];
    private graphics: Graphics;
    private tiles: Tile[][] = [];
    private fogOfWarMask: Graphics;

    constructor(screenWidth: number, screenHeight: number) {
        super();
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.graphics = new Graphics();
        this.addChild(this.graphics);

        this.fogOfWarMask = new Graphics();
        this.addChild(this.fogOfWarMask);

        this.createTiles();
        this.drawTiles();

        const clampy = new Clampy(Texture.from("inf.png"));
        clampy.x = this.screenWidth / 2 + 100;
        clampy.y = this.screenHeight / 2;
        clampy.targetX = clampy.x;
        clampy.targetY = clampy.y;
        clampy.health = 150;
        clampy.currentTile = this.getTileAt(clampy.x, clampy.y);
        console.log(clampy.currentTile);
        this.clampys.push(clampy);
        this.addChild(clampy);

        const enemy_clampy = new Clampy(Texture.from("inf_selected.png"));
        enemy_clampy.x = this.screenWidth / 2 - 150;
        enemy_clampy.y = this.screenHeight / 2;
        enemy_clampy.targetX = enemy_clampy.x;
        enemy_clampy.targetY = enemy_clampy.y;
        enemy_clampy.enemy = true;
        enemy_clampy.otherClampys.push(clampy);
        enemy_clampy.currentTile = this.getTileAt(enemy_clampy.x, enemy_clampy.y);
        console.log(enemy_clampy.currentTile);
        this.clampys.push(enemy_clampy);
        this.addChild(enemy_clampy);

        clampy.otherClampys.push(enemy_clampy);

        Ticker.shared.add(this.update, this);
    }

    private createTiles(): void {
        const tileWidth = 100;
        const tileHeight = 100;
        const rows = mapData.tiles.length;
        const cols = mapData.tiles[0].length;

        for (let row = 0; row < rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < cols; col++) {
                const type = this.getTileTypeFromString(mapData.tiles[row][col]);
                const tile = new Tile(type, col * tileWidth, row * tileHeight, tileWidth, tileHeight);
                this.tiles[row][col] = tile;
            }
        }
    }

    private getTileTypeFromString(type: number): TileType {
        switch (type) {
            case 0:
                return TileType.Open;
            case 1:
                return TileType.Concealment;
            case 2:
                return TileType.Cover;
            default:
                throw new Error(`Unknown tile type: ${type}`);
        }
    }

    private getTileAt(x: number, y: number): Tile | null {
        const row = Math.floor(y / 100);
        const col = Math.floor(x / 100);
        return this.tiles[row] ? this.tiles[row][col] : null;
    }

    private drawTiles(): void {
        this.tiles.forEach(row => {
            row.forEach(tile => {
                this.graphics.beginFill(this.getTileColor(tile.type));
                this.graphics.drawRect(tile.x, tile.y, tile.width, tile.height);
                this.graphics.endFill();
            });
        });
    }

    private getTileColor(type: TileType): number {
        switch (type) {
            case TileType.Open:
                return 0xc0ff6d; // White
            case TileType.Concealment:
                return 0x62bc2f; // Gray
            case TileType.Cover:
                return 0x555555; // Dark Gray
            default:
                return 0x000000; // Black
        }
    }

    public onStageClick(event: FederatedPointerEvent): void {
        for (const clampy of this.clampys) {
            if (event.target === clampy) {
                return;
            }
        }
        for (const clampy of this.clampys) {
            if (clampy.selected) {
                clampy.targetX = event.global.x;
                clampy.targetY = event.global.y;
                clampy.selected = false;
                clampy.texture = Texture.from("inf.png");
            }
        }
    }

    private getDistance(clampy1: Clampy, clampy2: Clampy): number {
        return Math.sqrt(Math.pow(clampy1.x - clampy2.x, 2) + Math.pow(clampy1.y - clampy2.y, 2));
    }

    private update(deltaTime: number): void {
        const visibilityRadius = 150;
        // Clear the previous fog of war mask
        this.fogOfWarMask.clear();
        this.fogOfWarMask.beginFill(0x000000, 0.5);
        this.fogOfWarMask.drawRect(0, 0, this.screenWidth, this.screenHeight);
        this.fogOfWarMask.beginHole(); 
        this.clampys.forEach((clampy, index) => {
            if (!this.healthBars[index]) {
                const healthBar = new Graphics();
                this.healthBars[index] = healthBar;
                this.addChild(healthBar);
            }
            const healthBar = this.healthBars[index];
            healthBar.clear();
            healthBar.beginFill(0xff1010);
            healthBar.drawRect(clampy.x - 25, clampy.y - 30, 50 * (clampy.health / 100), 5);
            healthBar.endFill();

            let distance = Math.sqrt(Math.pow(clampy.x - clampy.targetX, 2) + Math.pow(clampy.y - clampy.targetY, 2));
            if (distance > 1) {
                let direction = Math.atan2(clampy.targetY - clampy.y, clampy.targetX - clampy.x);
                clampy.x += Math.cos(direction) * deltaTime * clampy.speed;
                clampy.y += Math.sin(direction) * deltaTime * clampy.speed;
                clampy.currentTile = this.getTileAt(clampy.x, clampy.y);
            }

            if (!clampy.enemy) {
                this.fogOfWarMask.drawCircle(clampy.x, clampy.y, visibilityRadius);
            }

            for (const otherClampy of this.clampys) {
                if (clampy === otherClampy) {
                    continue;
                }
                else {
                    let distance = Math.sqrt(Math.pow(clampy.x - otherClampy.x, 2) + Math.pow(clampy.y - otherClampy.y, 2));
                    if (distance < 100) {
                        // Draw a line between the two clampys
                        otherClampy.graphics.clear();
                        otherClampy.graphics.lineStyle(1, 0x000000, 1);
                        otherClampy.graphics.moveTo(clampy.x, clampy.y);
                        otherClampy.graphics.lineTo(otherClampy.x, otherClampy.y);
                        let clampyDefenseEfficiency;
                        if (clampy.currentTile?.type === TileType.Cover) {
                            clampyDefenseEfficiency = 2;
                        }
                        else if (clampy.currentTile?.type === TileType.Concealment) {
                            clampyDefenseEfficiency = 1.5;
                        }
                        else {
                            clampyDefenseEfficiency = 1;
                        }
                        let otherClampyDefenseEfficiency;
                        if (otherClampy.currentTile?.type === TileType.Cover) {
                            otherClampyDefenseEfficiency = 2;
                        }
                        else if (otherClampy.currentTile?.type === TileType.Concealment) {
                            otherClampyDefenseEfficiency = 1.5;
                        }
                        else {
                            otherClampyDefenseEfficiency = 1;
                        }
                        clampy.health -= deltaTime * 1 / clampyDefenseEfficiency;
                        otherClampy.health -= deltaTime * 1 / otherClampyDefenseEfficiency;
                    }
                }
            }

            this.clampys.forEach(otherClampy => {
                if (clampy !== otherClampy && !clampy.enemy) {
                    const dist = this.getDistance(clampy, otherClampy);
                    otherClampy.visible = dist <= visibilityRadius || !otherClampy.enemy;
                }
            });

            if (clampy.health <= 0) {
                clampy.graphics.clear();
                this.removeChild(clampy);
                this.clampys.splice(this.clampys.indexOf(clampy), 1);
                this.healthBars.splice(index, 1);
            }
        });
        this.fogOfWarMask.endFill();
    }
}