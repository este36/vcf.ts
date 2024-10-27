import {vcfCursor}  from './vcfCursor.ts'

export class vcfToken {
    public id: vcfTokenEnum;
    public is_single: boolean;
    public begin: vcfCursor;
    public end: vcfCursor;
    
    constructor(_id: vcfTokenEnum, _is_single: boolean, _begin: vcfCursor = new vcfCursor(), _end: vcfCursor = new vcfCursor()) {
        this.id = _id;        
        this.is_single = _is_single;        
        this.begin = _begin;        
        this.end = _end;        
    };
}


export enum vcfTokenEnum {
    UNKNOWN = -1,
    SEMI_COLON,
    COLON,
    EQUAL,
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
    ORG,
    HOME,
    EMAIL,
    PREF,
    LITTERAL
}


export function vcfGetTokenEnumString( t :vcfTokenEnum): string {
    switch (t) {
        case vcfTokenEnum.UNKNOWN: return 'UNKNOWN';
        case vcfTokenEnum.SEMI_COLON: return 'SEMI_COLON';
        case vcfTokenEnum.COLON: return 'COLON';
        case vcfTokenEnum.EQUAL: return 'EQUAL';
        case vcfTokenEnum.BEGIN_EOL: return 'BEGIN_EOL';
        case vcfTokenEnum.EOL: return 'EOL';
        case vcfTokenEnum.EOF: return 'EOF';
        case vcfTokenEnum.VCARD: return 'VCARD';
        case vcfTokenEnum.VERSION: return 'VERSION';
        case vcfTokenEnum.BEGIN: return 'BEGIN';
        case vcfTokenEnum.END: return 'END';
        case vcfTokenEnum.N: return 'N';
        case vcfTokenEnum.FN: return 'FN';
        case vcfTokenEnum.TEL: return 'TEL';
        case vcfTokenEnum.ORG: return 'ORG';
        case vcfTokenEnum.HOME: return 'HOME';
        case vcfTokenEnum.EMAIL: return 'EMAIL';
        case vcfTokenEnum.PREF: return 'PREF';
        case vcfTokenEnum.LITTERAL: return 'LITTERAL';
        default: return 'INVALID';
    }
};


export function vcfGetTokenEnum(in_str: string): vcfTokenEnum {
    if (in_str.length > 1) in_str = in_str.toUpperCase(); 

    switch(in_str) 
    {
        case ';': return vcfTokenEnum.SEMI_COLON;        
        case ':': return vcfTokenEnum.COLON;        
        case '=': return vcfTokenEnum.EQUAL;        
        case '\r': return vcfTokenEnum.BEGIN_EOL;        
        case '\n': return vcfTokenEnum.EOL;        
        case '\0': return vcfTokenEnum.EOF;        
        case 'VCARD': return vcfTokenEnum.VCARD;        
        case 'VERSION': return vcfTokenEnum.VERSION;        
        case 'BEGIN': return vcfTokenEnum.BEGIN;        
        case 'END': return vcfTokenEnum.END;        
        case 'N': return vcfTokenEnum.N;        
        case 'FN': return vcfTokenEnum.FN;        
        case 'TEL': return vcfTokenEnum.TEL;        
        case 'ORG': return vcfTokenEnum.ORG;
        case 'HOME': return vcfTokenEnum.HOME;
        case 'EMAIL': return vcfTokenEnum.EMAIL;        
        case 'PREF': return vcfTokenEnum.PREF;        
        case 'LITTERAL': return vcfTokenEnum.LITTERAL;
        default: return vcfTokenEnum.UNKNOWN;
    } 
}

