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
    public result_log: string;

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

        while (this.cursor.pos < this.file_content.length)
        {
            let temp_cursor: vcfCursor = new vcfCursor(this.cursor.pos, this.cursor.row, this.cursor.col);
            this.tokenise(temp_cursor);
        }

        for (let i: number = 0; i < this.tokens.length; i++){
             if (this.validateToken(i) === -1) return;
        }

        this.result_log = 'File parsed successfully.'
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
            } else if (vcfGetTokenEnum(char) === vcfTokenEnum.EOL){
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

    private GetSyntaxErrorMessage(tokenIndex: number, error_message: string): string {
        let buffer: string = '';
        buffer += 'Syntax Error at line ';
        buffer += ++(this.tokens[tokenIndex].begin.row);
        buffer += ', collumn ';
        buffer += ++(this.tokens[tokenIndex].begin.col);
        buffer += ': \'';
        buffer += this.GetTokenValue(tokenIndex);
        buffer += '\': ';
        buffer += error_message;
        return buffer;
    }

    private validateToken(tokenIndex: number): number {
        switch (this.tokens[tokenIndex].id)
        {   
            case vcfTokenEnum.SEMI_COLON:
                break;
            case vcfTokenEnum.COLON:
                if (this.tokens[tokenIndex - 1].id === vcfTokenEnum.COLON || this.tokens[tokenIndex + 1].id === vcfTokenEnum.COLON ) {
                    this.result_log = this.GetSyntaxErrorMessage(tokenIndex, "Colons cannot be close to each others.");
                    return -1;
                }
                break;
            case vcfTokenEnum.EQUAL:
                break;
            case vcfTokenEnum.BEGIN_EOL:
                break;
            case vcfTokenEnum.EOL:
                break;
            case vcfTokenEnum.EOF:
                break;
            case vcfTokenEnum.VCARD:
                if (this.tokens[tokenIndex - 2].id !== vcfTokenEnum.BEGIN && this.tokens[tokenIndex - 2].id !== vcfTokenEnum.END) {
                    this.result_log = this.GetSyntaxErrorMessage(tokenIndex, "Unknown identifier found before the token.");
                    return -1
                }
                break;
            case vcfTokenEnum.VERSION:
                break;
            case vcfTokenEnum.BEGIN:
                if (this.tokens[tokenIndex + 2].id !== vcfTokenEnum.VCARD || this.tokens[tokenIndex + 1].id !== vcfTokenEnum.COLON ) {
                    this.result_log = this.GetSyntaxErrorMessage(tokenIndex, "Identifier expected");
                    return -1
                }
                break;
            case vcfTokenEnum.END:
                if (this.tokens[tokenIndex + 2].id !== vcfTokenEnum.VCARD || this.tokens[tokenIndex + 1].id !== vcfTokenEnum.COLON ) {
                    this.result_log = this.GetSyntaxErrorMessage(tokenIndex, "Identifier expected");
                    return -1
                }
                break;
            case vcfTokenEnum.N:
                break;
            case vcfTokenEnum.FN:
                break;
            case vcfTokenEnum.TEL:
                break;
            case vcfTokenEnum.ORG:
                break;
            case vcfTokenEnum.HOME:
                break;
            case vcfTokenEnum.EMAIL:
                break;
            case vcfTokenEnum.PREF:
                break;
            case vcfTokenEnum.LITTERAL:
                if (this.tokens[tokenIndex - 1].id === vcfTokenEnum.LITTERAL || this.tokens[tokenIndex + 1].id === vcfTokenEnum.LITTERAL) {
                    this.result_log = this.GetSyntaxErrorMessage(tokenIndex, "Litterals cannot be closed to each others.");
                    return -1
                }
                break;
            default: return 0;
        }
        return 0;
    }
}