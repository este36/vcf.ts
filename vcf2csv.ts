import * as fs from 'node:fs';

const MAX_STRING_SIZE: number = 256;
function DEBUG(cout: string = ''): void {
    console.log('[DEBUG] ' +  cout);
}

class VcfContact {
    public fullName: string;
    public name: string;
    public surname: string;
    public email: string;
    public cellPhoneNumbers: string [];

    constructor() {
        this.fullName = '';
        this.name = '';
        this.surname = '';
        this.email = '';
        this.cellPhoneNumbers = [];
    }
}


enum VcfTokenEnum {
    UNKNOWN = -1,
    SEMI_COLON,
    COLON,
    BEGIN_EOL,
    EOL,
    EOF,
    VCARD,
    VERSION,
    BEGIN,
    END,
    N,
    FN,
    TEL,
    LITTERAL
}

class VcfCursor {
    public pos: number;
    public row: number;
    public col: number;

    constructor(_pos: number = 0, _row: number = 0, _col: number = 0) {
        this.pos = _pos;        
        this.row = _row;        
        this.col = _col;        
    };
}

class VcfToken {
    public id: VcfTokenEnum;
    public is_single: boolean;
    public begin: VcfCursor;
    public end: VcfCursor;
    
    constructor(_id: VcfTokenEnum, _is_single: boolean, _begin: VcfCursor = new VcfCursor(), _end: VcfCursor = new VcfCursor()) {
        this.id = _id;        
        this.is_single = _is_single;        
        this.begin = _begin;        
        this.end = _end;        
    };
}

export class VcfParser {
    public contacts: VcfContact [];

    public to_console(): void {
        console.log('/***** Contacts : *****/');
        console.log(this.contacts[0]);
        console.log('/***** Tokens : *****/');
        let cout: string = '{ '; 
        for (let i = 0; i < this.tokens.length; i++){
            // console.log('is_single:',this.tokens[i].is_single);
            // console.log('begin:',this.tokens[i].begin);
            // console.log('end:', this.tokens[i].end);
            // console.log('ID:', this.tokens[i].id);
            // console.log('Actual String : ' , '\"' + this.GetToken(i) + '\"' );
            // console.log("//////////////////////////")
            cout += '\"';
            // cout += this.GetToken(i);
            cout += this.tokens[i].id;
            cout += '\", \n';

            
        }
        cout += '\"EOF';
        cout += '\" }';
     
        console.log(cout);
    };

    constructor (file_path: string) {
        this.file_content = fs.readFileSync(file_path, 'utf-8');
        this.contacts = [];
        this.cursor = new VcfCursor(0,0,0);
        this.tokens = [];

        this.parse();
    };

    private file_content: string;
    private cursor: VcfCursor;
    private tokens: VcfToken [];

    private GetToken(tokenIndex: number): string {
        if (tokenIndex < this.tokens.length) {
            if (this.tokens[tokenIndex].id === VcfTokenEnum.EOL){
                return 'EOL';
            }

            if (this.tokens[tokenIndex].is_single ===  true){
                return this.file_content[this.tokens[tokenIndex].begin.pos - 1]
            } else {
                return this.file_content.substring(this.tokens[tokenIndex].begin.pos, this.tokens[tokenIndex].end.pos);
            }
        }
        else {
            return '\0';
        }
    };

    private chop_char(): string {
        if (this.cursor.pos < this.file_content.length) {
            let char: string = this.file_content[this.cursor.pos];
            this.cursor.pos++;
            this.cursor.col++;

            if (this.GetTokenId(char) === VcfTokenEnum.BEGIN_EOL){
                char = this.chop_char();
            }

            if (this.GetTokenId(char) === VcfTokenEnum.EOL){
                this.cursor.row++;
                this.cursor.col = 0;
            }
            return char;
        }else {
            return '\0'
        }
    };

    private GetTokenId(in_str: string): VcfTokenEnum {
        if (in_str.length > 1) in_str = in_str.toUpperCase(); 

        switch(in_str) 
        {
            case ';': return VcfTokenEnum.SEMI_COLON;
            case ':': return VcfTokenEnum.COLON;
            case '\r': return VcfTokenEnum.BEGIN_EOL;
            case '\n': return VcfTokenEnum.EOL;
            case '\0': return VcfTokenEnum.EOF;
            case 'BEGIN': return  VcfTokenEnum.BEGIN;
            default: return VcfTokenEnum.UNKNOWN;
        } 
    }

    private tokenise(temp_cursor: VcfCursor): void {
        let temp_token: VcfToken = new VcfToken(VcfTokenEnum.UNKNOWN, true, temp_cursor);
        // console.log('/// ');
        // console.log('ENTREE ' , temp_token);
        // console.log('\\\\\\ ');
        
        let cursor_temp_pos: number = this.cursor.pos;
        let cursor_temp_row: number = this.cursor.row;
        let cursor_temp_col: number = this.cursor.col;
        
        
        
        let buffer: string = '';
        let single: string;
        buffer += this.chop_char();
        temp_token.id = this.GetTokenId(buffer);
        
        
        if (temp_token.id === VcfTokenEnum.UNKNOWN) {
            temp_token.is_single = false;
        }else {
            console.log('new single 2: ' ,temp_token)
            this.tokens.push(temp_token);
            return;
        }

        let should_push_single: boolean = false;
        let single_id: VcfTokenEnum = VcfTokenEnum.UNKNOWN;
        while (should_push_single !== true && buffer.length < MAX_STRING_SIZE ) {
            
            cursor_temp_pos = this.cursor.pos;
            cursor_temp_row = this.cursor.row;
            cursor_temp_col = this.cursor.col;

            single = this.chop_char();
            single_id = this.GetTokenId(single); 

            if (single_id !== VcfTokenEnum.UNKNOWN){
                should_push_single = true;
                temp_token.id = VcfTokenEnum.LITTERAL;
            } 

            buffer += single;
            temp_token.id = this.GetTokenId(buffer);
        }

        if (temp_token.id === VcfTokenEnum.UNKNOWN){
            temp_token.id = VcfTokenEnum.LITTERAL;
        }
        
        if (buffer.length < MAX_STRING_SIZE) {
            temp_token.end = new VcfCursor(cursor_temp_pos, cursor_temp_row, cursor_temp_col);
            // console.log('new litteral: ' ,temp_token)
            this.tokens.push(temp_token);

            if (should_push_single){
                // console.log('new single 2: ' ,new VcfToken(single_id, true, new VcfCursor(this.cursor.pos, this.cursor.row, this.cursor.col)))
                this.tokens.push( new VcfToken(single_id, true, new VcfCursor(this.cursor.pos, this.cursor.row, this.cursor.col)));
            }
            return;
        } else {
            console.error('MAX_STRNG_SIZE')
        }
        
    }

    private parse(): void {
        this.cursor.pos = 0;
        let i: number = 0;
        while (this.cursor.pos < this.file_content.length)
        {
            let temp_cursor: VcfCursor = new VcfCursor(this.cursor.pos, this.cursor.row, this.cursor.row);
            this.tokenise(temp_cursor);

            // if (i > 100) {
            //     return;
            // }
            i++;
        }
    }
}