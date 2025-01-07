import { Container, Ticker, FederatedPointerEvent, Texture } from 'pixi.js';
import { Clampy } from './Clampy';

export class Scene extends Container {
    private readonly screenWidth: number;
    private readonly screenHeight: number;
    private clampys: Clampy[] = [];

    constructor(screenWidth: number, screenHeight: number) {
        super();
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        const clampy = new Clampy(Texture.from("inf.png"));
        clampy.x = this.screenWidth / 2 + 50;
        clampy.y = this.screenHeight / 2;
        clampy.targetX = clampy.x;
        clampy.targetY = clampy.y;
        clampy.health = 150;
        this.clampys.push(clampy);
        this.addChild(clampy);

        const enemy_clampy = new Clampy(Texture.from("inf_selected.png"));
        enemy_clampy.x = this.screenWidth / 2 - 50;
        enemy_clampy.y = this.screenHeight / 2;
        enemy_clampy.targetX = enemy_clampy.x;
        enemy_clampy.targetY = enemy_clampy.y;
        enemy_clampy.enemy = true;
        enemy_clampy.otherClampys.push(clampy);
        this.clampys.push(enemy_clampy);
        this.addChild(enemy_clampy);

        clampy.otherClampys.push(enemy_clampy);

        Ticker.shared.add(this.update, this);
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

    private update(deltaTime: number): void {
        for (const clampy of this.clampys) {
            let direction = Math.atan2(clampy.targetY - clampy.y, clampy.targetX - clampy.x);
            clampy.x += Math.cos(direction) * deltaTime * clampy.speed;
            clampy.y += Math.sin(direction) * deltaTime * clampy.speed;

            for (const otherClampy of this.clampys) {
                if (clampy === otherClampy) {
                    continue;
                }
                else {
                    let distance = Math.sqrt(Math.pow(clampy.x - otherClampy.x, 2) + Math.pow(clampy.y - otherClampy.y, 2));
                    if (distance < 50) {
                        clampy.health -= deltaTime;
                        otherClampy.health -= deltaTime;
                    }
                }
            }

            if (clampy.health <= 0) {
                this.removeChild(clampy);
                this.clampys.splice(this.clampys.indexOf(clampy), 1);
            }
        }
    }
}