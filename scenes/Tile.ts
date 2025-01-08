export enum TileType {
    Open,
    Concealment,
    Cover
}

export class Tile {
    public type: TileType;
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    constructor(type: TileType, x: number, y: number, width: number, height: number) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}