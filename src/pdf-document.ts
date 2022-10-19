import * as path from "path";
import {PdfProvider} from "./pdf-provider";
import {TPdfJs} from "./types";
import {PdfPage} from "./pdf-page";

export interface IPdfDocumentConstructorOptions extends ICreateDocumentOptions {
    pdf_provider: PdfProvider;
}

export interface ICreateDocumentOptions {
    file_buffer: Buffer;
    do_not_load_pages?: boolean;
}

export interface IPdfDocumentInfo {
    no_of_pages: number;
    format_version?: string;
    creator?: string;
    producer?: string;
}

export type TPages<T extends (string | number) = number> = Map<T, PdfPage>;

export class PdfDocument {

    public static STANDARD_FONT_FOLDER = path.join(`${require.resolve('pdfjs-dist')}`, '../../standard_fonts/')

    private readonly _pdf_provider: PdfProvider;
    private readonly _loading: Promise<void>;

    private _pdf_js_document: TPdfJs.PDFDocumentProxy;
    private _pdf_js_meta: any;

    private _errors: string[] = [];
    private _pages: TPages = new Map();

    constructor(options: IPdfDocumentConstructorOptions) {

        this._pdf_provider = options.pdf_provider;

        this._loading = (async () => {
            this._pdf_js_document = await this._pdf_provider.pdf_js.getDocument({
                data: options.file_buffer,
                standardFontDataUrl: PdfDocument.STANDARD_FONT_FOLDER
            }).promise;

            this._pdf_js_meta = await this._pdf_js_document.getMetadata();

            if(!options.do_not_load_pages) await this.load_pages();

        })();
    }

    public static async load(options: IPdfDocumentConstructorOptions): Promise<PdfDocument> {
        const pdf_document = new PdfDocument(options);

        await pdf_document.wait_for_load();

        return pdf_document;
    }

    private async load_pages(): Promise<void> {
        for(let i = 0; i < this._pdf_js_document.numPages; i++) {

            const page_no = i + 1;

            try {
                const pdf_page = await PdfPage.load({
                    pdf_provider: this._pdf_provider,
                    pdf_js_document: this._pdf_js_document,
                    page_no
                });

                this._pages.set(page_no, pdf_page);

            } catch(err) {
                this._errors.push(`Unable to load Page #${page_no} - ${err.message}`);
            }

        }
    }

    public async wait_for_load(): Promise<void> {
        await this._loading;
    }

    public apply_filter(regexp: RegExp, use_regex_index?: boolean): TPages<string> {
        return Array.from(this._pages.values()).reduce((_, page) => {

            const matching_identifier = page.search(regexp);

            if(matching_identifier) _.set(use_regex_index ? matching_identifier : page.page_no, page);

            return _;
        }, new Map() as TPages<any>);
    }

    public get info(): IPdfDocumentInfo {
        return {
            no_of_pages: this._pdf_js_document.numPages,
            format_version: this._pdf_js_meta?.info.PDFFormatVersion,
            creator: this._pdf_js_meta?.info.Creator,
            producer: this._pdf_js_meta?.info.Producer,
        }
    }

    public get pages(): TPages {
        return this._pages;
    }

    public get has_errors(): boolean {
        return this._errors.length > 0;
    }

    public get errors(): string[] {
        return this._errors;
    }

}