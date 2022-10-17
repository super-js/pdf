import * as fs from "fs";
import {PdfProvider} from "./pdf-provider";

jest.setTimeout(20000);

describe("", () => {
    it("should work", async () => {

        const pdf_provider = await PdfProvider.build();
        const doc = await pdf_provider.load_document({
            file_buffer: fs.readFileSync("C:\\dev\\bon\\10927c_R3 - PRODUCTION A1\\10927c_R3_SortedFabSheet.pdf")
        });

        const pages = Array.from(doc.apply_filter(/TRUSS-T{1}\d{3}/, true).entries());

        for(let i = 0; i < pages.length; i++) {
            const [code, page] = pages[i];

            console.time(code);
            const image = await page.as_png({scale: 5.0});
            fs.writeFileSync(`C:\\dev\\bon\\10927c_R3 - PRODUCTION A1\\pages\\${code}.png`, image);

            if(page.includes("Page 1 of 2")) {
                const image_page_2 = await doc.pages.get(page.page_no + 1).as_png({scale: 5.0});
                fs.writeFileSync(`C:\\dev\\bon\\10927c_R3 - PRODUCTION A1\\pages\\${code}_page_2.png`, image_page_2);
            }

            console.timeEnd(code);
        }
    })
})