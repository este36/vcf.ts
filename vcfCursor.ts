export class vcfCursor {
    public pos: number;
    public row: number;
    public col: number;

    constructor(_pos: number = 0, _row: number = 0, _col: number = 0) {
        this.pos = _pos;        
        this.row = _row;        
        this.col = _col;        
    };
}
