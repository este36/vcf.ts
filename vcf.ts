import * as fs from 'node:fs';
import {vcfTokenEnum , vcfToken , vcfGetTokenEnumString , vcfGetTokenEnum} from './vcfToken.ts';
import { vcfCursor } from './vcfCursor.ts';


const MAX_STRING_SIZE: number = 256;

class vcfContact {
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

export class vcfParser {
    public contacts: vcfContact [];

    public to_console(): void {
        console.log('/***** Contacts : *****/');
        for (let i:number = 0; i < this.contacts.length;  i++) {
            console.log(this.contacts[i]);     
        }
    };

    constructor (file_path: string) {
        this.file_content = fs.readFileSync(file_path, 'utf-8');
        this.contacts = [];
        this.cursor = new vcfCursor(0,0,0);
        this.tokens = [];

        this.parse();
    };

    private file_content: string;
    private cursor: vcfCursor;
    private tokens: vcfToken [];

    private GetTokenValue(tokenIndex: number): string {
        if (tokenIndex < this.tokens.length) {
            if (this.tokens[tokenIndex].id === vcfTokenEnum.EOL){
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

            if (vcfGetTokenEnum(char) === vcfTokenEnum.BEGIN_EOL){
                char = this.chop_char();
            }

            if (vcfGetTokenEnum(char) === vcfTokenEnum.EOL){
                this.cursor.row++;
                this.cursor.col = 0;
            }
            return char;
        }else {
            return '\0'
        }
    };

    private tokenise(begin_cursor: vcfCursor): void {
        let temp_token: vcfToken = new vcfToken(vcfTokenEnum.UNKNOWN, true, begin_cursor);
        
        let single: string;
        let buffer: string = this.chop_char();
        temp_token.id = vcfGetTokenEnum(buffer);
        

        if (temp_token.id === vcfTokenEnum.UNKNOWN) {
            temp_token.is_single = false;
        }else {
            temp_token.begin.pos = this.cursor.pos;
            temp_token.begin.row = this.cursor.row;
            temp_token.begin.col = this.cursor.col;
            this.tokens.push(temp_token);
            return;
        }

        temp_token.id = vcfTokenEnum.LITTERAL;
        let litteral_end_cursor: vcfCursor = new vcfCursor();

        let should_push_single: boolean = false;
        let single_id: vcfTokenEnum = vcfTokenEnum.UNKNOWN;

        while (should_push_single !== true && buffer.length < MAX_STRING_SIZE ) {
            
            litteral_end_cursor.pos = this.cursor.pos;
            litteral_end_cursor.row = this.cursor.row;
            litteral_end_cursor.col = this.cursor.col;

            single = this.chop_char();
            single_id = vcfGetTokenEnum(single); 

            if (single_id !== vcfTokenEnum.UNKNOWN && single_id !== vcfTokenEnum.N){
                should_push_single = true;
            } 

            buffer += single;
        }

        if (buffer.length < MAX_STRING_SIZE) {

            let lit_token_str = this.file_content.substring(begin_cursor.pos, litteral_end_cursor.pos);
            
            temp_token.id = vcfGetTokenEnum(lit_token_str);

            if (temp_token.id == vcfTokenEnum.UNKNOWN) temp_token.id = vcfTokenEnum.LITTERAL; 
            
            temp_token.end = litteral_end_cursor;
            this.tokens.push(temp_token);

            if (should_push_single){
                this.tokens.push( new vcfToken(single_id, true, new vcfCursor(this.cursor.pos, this.cursor.row, this.cursor.col)));
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
            let temp_cursor: vcfCursor = new vcfCursor(this.cursor.pos, this.cursor.row, this.cursor.row);
            this.tokenise(temp_cursor);

            i++;
        }

        let buffer: string = '';
        for ( let i: number = 0; i < this.tokens.length; i++) {
            buffer += vcfGetTokenEnumString(this.tokens[i].id);
            buffer += ' : "';
            if (this.tokens[i].id != vcfTokenEnum.EOL) buffer += this.GetTokenValue(i);
            buffer += '"';
            buffer += '\r\n';
        }

        fs.writeFile('vcfTokens.txt', buffer, (err) => {
            if (err) throw err;
            console.log('Fichier créé et contenu écrit avec succès');
        });
    }
}