import ColorThief from 'colorthief';
import type { ThemeColors } from '../types';

const rgbToHex = (r: number, g: number, b: number): string => 
  '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');

// Simple function to check if a color is not too dark/gray to avoid muddy palettes
const isVibrant = (r: number, g: number, b: number): boolean => {
    const avg = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    return avg > 40 && saturation > 40;
};

// Helper function to attempt loading and extracting colors from a given URL
const loadAndExtract = (url: string): Promise<ThemeColors | null> => {
  return new Promise((resolve, reject) => {
    const colorThief = new ColorThief();
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;

    // Set a timeout for the image load attempt
    const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timed out for ${url}`));
    }, 7000); // 7 second timeout

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const paletteRGB = colorThief.getPalette(img, 5);
        if (!paletteRGB || paletteRGB.length < 3) {
          resolve(null);
          return;
        }

        const vibrantPalette = paletteRGB.filter(rgb => isVibrant(rgb[0], rgb[1], rgb[2]));
        const finalPalette = vibrantPalette.length >= 3 ? vibrantPalette : paletteRGB;
        
        const hexPalette = finalPalette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));

        resolve({
          primary: hexPalette[0],
          secondary: hexPalette[1],
          gradientColors: [hexPalette[0], hexPalette[1], hexPalette[2]],
        });

      } catch (error) {
        console.error('Color-thief error:', error);
        reject(error);
      }
    };

    img.onerror = (err) => {
      clearTimeout(timeoutId);
      reject(err);
    };
  });
};

export const extractColorsFromImage = async (imageUrl: string): Promise<ThemeColors | null> => {
    if (!imageUrl || imageUrl.endsWith('.svg')) { // ColorThief doesn't support SVG
      return null;
    }

    // List of CORS proxies to try in order.
    const proxies = [
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];

    for (const proxyFn of proxies) {
        const proxiedUrl = proxyFn(imageUrl);
        try {
            console.log(`Attempting to extract colors for ${imageUrl} via proxy...`);
            const colors = await loadAndExtract(proxiedUrl);
            if (colors) {
                console.log(`Successfully extracted colors for ${imageUrl}`);
                return colors; // Success, return the colors
            }
        } catch (error) {
            console.warn(`Proxy failed for ${imageUrl}. Trying next proxy.`, error);
            // Error occurred, loop will try the next proxy.
        }
    }

    console.error(`All proxies failed for image color extraction: ${imageUrl}`);
    return null; // All proxies failed
};