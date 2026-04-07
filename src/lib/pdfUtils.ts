import * as pdfjsLib from 'pdfjs-dist';

// Use a reliable CDN for the worker to avoid complex bundler configurations
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const generatePdfThumbnail = async (file: File): Promise<File | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Calculate scale to fit within a maximum dimension (e.g. 500px)
    const MAX_DIM = 500;
    const viewport_orig = page.getViewport({ scale: 1.0 });
    const scale = Math.min(MAX_DIM / viewport_orig.width, MAX_DIM / viewport_orig.height, 1.0);
    const viewport = page.getViewport({ scale });
    
    // Prepare canvas using standard DOM
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    
    if (!context) {
      console.warn("Could not get canvas context for PDF thumbnail");
      return null;
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // White background in case PDF has transparency
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render PDF page into canvas context
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    // Convert the canvas to a JPEG blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8); // 80% quality
    });
    
    if (!blob) return null;
    
    // Wrap in a File object
    const extMatch = file.name.match(/\.pdf$/i);
    const baseName = extMatch ? file.name.substring(0, file.name.length - 4) : file.name;
    const thumbName = `${baseName}_thumbnail.jpg`;
    
    return new File([blob], thumbName, { type: 'image/jpeg' });
  } catch (err) {
    console.error('Error securely generating PDF thumbnail natively:', err);
    return null;
  }
};
