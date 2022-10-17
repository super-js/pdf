import {ICreateDocumentOptions, PdfDocument} from "./pdf-document";
import {TPdfJs} from "./types";

export class PdfProvider {

    private _pdf_js: typeof TPdfJs;

    private readonly building: Promise<void>;

    constructor() {
        this.building = (async () => {
            this._pdf_js = await import("pdfjs-dist/legacy/build/pdf");
        })();
    }

    public static async build(): Promise<PdfProvider> {
        const pdf_provider = new PdfProvider();

        await pdf_provider.wait_for_build();

        return pdf_provider;
    }

    public async wait_for_build(): Promise<void> {
        await this.building;
    }

    public async load_document(options: ICreateDocumentOptions): Promise<PdfDocument> {
        const pdf_document = await PdfDocument.load({
            pdf_provider: this,
            file_buffer: options.file_buffer
        });

        return pdf_document;
    }

    public get pdf_js(): typeof TPdfJs {
        return this._pdf_js;
    }

}