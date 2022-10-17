import {TPdfJs} from "./types";
import {PdfProvider} from "./pdf-provider";
import {createCanvas} from "canvas";

export interface IPdfPageConstructorOptions {
    pdf_provider: PdfProvider;
    pdf_js_document: TPdfJs.PDFDocumentProxy;
    page_no: number;
}

export interface IAsPngOptions {
    scale?: number;
}

export class PdfPage {

    private readonly _pdf_provider: PdfProvider;
    private readonly _page_no: number;
    private readonly _pdf_js_document: TPdfJs.PDFDocumentProxy;
    private readonly _loading: Promise<void>;

    private _text: string = "";

    private _pdf_js_page: TPdfJs.PDFPageProxy;
    private _pdf_js_text_content: any;

    constructor(options: IPdfPageConstructorOptions) {

        if(options.page_no > options.pdf_js_document.numPages) {
            throw new Error(`Invalid Page #${options.page_no} - Total # of pages is ${options.pdf_js_document.numPages}`);
        }

        this._pdf_provider = options.pdf_provider;
        this._pdf_js_document = options.pdf_js_document;
        this._page_no = options.page_no;

        this._loading = (async () => {
            this._pdf_js_page = await this._pdf_js_document.getPage(this._page_no);
            this._pdf_js_text_content = await this._pdf_js_page.getTextContent();

            this._text = this.items_to_text();
        })();
    }

    private static standard_text_replace(input_string): string {
        return input_string.replace(/(?:\r\n|\r|\n| )/g, '');
    }

    public static async load(options: IPdfPageConstructorOptions): Promise<PdfPage> {
        const pdf_page = new PdfPage(options);

        await pdf_page.wait_for_load();

        return pdf_page;
    }

    public search(regexp: RegExp): string {
        const matches = this._text.match(regexp);

        return matches?.length > 0 ? matches[0] : null;
    }

    public includes(search_string: string): boolean {
        return this._text.toUpperCase().includes(PdfPage.standard_text_replace(search_string).toUpperCase(), 0);
    }

    public async as_png(options?: IAsPngOptions): Promise<Buffer> {

        const pdf_js_viewport = await this._pdf_js_page.getViewport({
            scale: options?.scale || 1.0
        });
        const canvas = createCanvas(pdf_js_viewport.width, pdf_js_viewport.height);
        const canvas_context = canvas.getContext('2d');

        await this._pdf_js_page.render({
            canvasContext: canvas_context,
            viewport: pdf_js_viewport,
        }).promise;

        return canvas.toBuffer('image/png', {
            compressionLevel: 3
        });
    }

    private items_to_text(): string {
        return this._pdf_js_text_content.items.reduce((_, item) => {
            _ += PdfPage.standard_text_replace(item.str);
            return _;
        }, "");
    }

    public async wait_for_load(): Promise<void> {
        await this._loading;
    }

    public get text(): string {
        return this._text;
    }

    public get page_no(): number {
        return this._page_no;
    }

}