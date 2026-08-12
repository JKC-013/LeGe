import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const generatePdfThumbnail = async (file: File): Promise<string> => {
  const fileReader = new FileReader();
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error("PDF generation timeout")), 15000);
    
    fileReader.onload = async function() {
      const typedarray = new Uint8Array(this.result as ArrayBuffer);

      try {
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const page = await pdf.getPage(1);
        
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Could not create canvas context");
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext as any).promise;
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        clearTimeout(timeoutId);
        resolve(dataUrl);
      } catch (err) {
        clearTimeout(timeoutId);
        reject(err);
      }
    };
    fileReader.onerror = (err) => { clearTimeout(timeoutId); reject(err); };
    fileReader.readAsArrayBuffer(file);
  });
};
