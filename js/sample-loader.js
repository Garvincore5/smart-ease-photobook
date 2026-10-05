/**
 * SmartAlbums Sample Photo Data & Loader
 * Provides instant wedding & portrait sample photo sets from local studio folder
 * or generates elegant synthetic studio test images.
 */

const LOCAL_SAMPLE_PHOTOS = [
  {
    name: 'Ceremonial Blessing',
    src: '../rafia pictures/introduction/2026_07_20_20_15_55_IMG_8059 (1).JPG',
    aspect: 0.67 // Portrait
  },
  {
    name: 'Joyous Entourage',
    src: '../rafia pictures/introduction/2026_07_20_20_15_55_IMG_8059 (2).JPG',
    aspect: 1.5 // Landscape
  },
  {
    name: 'Veil & Adornment',
    src: '../rafia pictures/introduction/2026_07_20_20_15_55_IMG_8059 (3).JPG',
    aspect: 0.67 // Portrait
  },
  {
    name: 'Moment of Grace',
    src: '../rafia pictures/introduction/2026_07_20_20_15_55_IMG_8059 (4).JPG',
    aspect: 1.5 // Landscape
  },
  {
    name: 'Cultural Splendour',
    src: '../rafia pictures/introduction/2026_07_20_20_15_55_IMG_8059 (5).JPG',
    aspect: 0.67 // Portrait
  },
  {
    name: 'Ancestral Blessing',
    src: '../rafia pictures/introduction/2026_07_20_20_15_55_IMG_8059 (6).JPG',
    aspect: 1.5 // Landscape
  },
  {
    name: 'Kwanjula Elegance',
    src: '../rafia pictures/introduction/2026_07_20_20_15_55_IMG_8059 (7).JPG',
    aspect: 1.5 // Landscape
  },
  {
    name: 'Welcome Entrance',
    src: '../rafia pictures/introduction/2026_07_20_20_18_45_IMG_8061.JPEG',
    aspect: 1.5 // Landscape
  },
  {
    name: 'Bridal Portrait',
    src: '../rafia pictures/portraits/2026_07_20_20_23_13_IMG_8065.JPEG',
    aspect: 0.67 // Portrait
  },
  {
    name: 'Radiant Smile',
    src: '../rafia pictures/portraits/2026_07_22_20_50_01_IMG_8289.JPG',
    aspect: 0.67 // Portrait
  },
  {
    name: 'Groom Silhouette',
    src: '../rafia pictures/portraits/2026_07_25_20_32_01_IMG_8383.JPEG',
    aspect: 0.67 // Portrait
  },
  {
    name: 'Ceremonial Rites',
    src: '../rafia pictures/kuhinjira/2026_04_04_15_05_14_IMG_8710.JPG',
    aspect: 1.5 // Landscape
  },
  {
    name: 'Traditional Gifting',
    src: '../rafia pictures/kuhinjira/2026_04_04_15_06_24_IMG_8711.JPG',
    aspect: 1.5 // Landscape
  },
  {
    name: 'Royal Welcome',
    src: '../rafia pictures/kuhinjira/2026_04_04_15_10_19_IMG_8714.JPG',
    aspect: 0.67 // Portrait
  },
  {
    name: 'Elders Blessing',
    src: '../rafia pictures/kuhinjira/2026_04_04_15_12_48_IMG_8715.JPG',
    aspect: 1.5 // Landscape
  },
  {
    name: 'Celebration Feast',
    src: '../rafia pictures/kuhinjira/2026_04_04_15_16_14_IMG_8717.JPG',
    aspect: 1.5 // Landscape
  }
];

class SampleLoader {
  /**
   * Generates a studio test photo via SVG canvas if offline local photos aren't accessible
   */
  static createSyntheticPhoto(title, aspect = 1.33, colorA = '#1e3a8a', colorB = '#0284c7') {
    const isPortrait = aspect < 1.0;
    const width = isPortrait ? 600 : 900;
    const height = Math.round(width / aspect);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative fine art frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Camera aperture icon / circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 20, 48, 0, Math.PI * 2);
    ctx.stroke();

    // Text Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, width / 2, height / 2 + 50);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`${width} × ${height} (${isPortrait ? 'Portrait' : 'Landscape'})`, width / 2, height / 2 + 82);

    return {
      name: title,
      src: canvas.toDataURL('image/jpeg', 0.9),
      width,
      height,
      aspect
    };
  }

  /**
   * Loads the local wedding samples into the album state
   */
  static async loadStudioSamples(albumState) {
    const photosToLoad = [];

    // Verify if local image paths can be loaded
    for (let i = 0; i < LOCAL_SAMPLE_PHOTOS.length; i++) {
      const sample = LOCAL_SAMPLE_PHOTOS[i];
      const verified = await this._testImageSrc(sample.src);
      if (verified) {
        if (albumState.imagePipeline) {
          const id = 'sample-' + i;
          const processed = await albumState.imagePipeline.processPhoto(sample.src, id, sample.name);
          photosToLoad.push(processed);
        } else {
          photosToLoad.push({
            id: 'sample-' + i,
            name: sample.name,
            src: sample.src,
            thumbSrc: sample.src,
            originalSrc: sample.src,
            aspect: sample.aspect,
            width: sample.aspect < 1 ? 800 : 1200,
            height: sample.aspect < 1 ? 1200 : 800
          });
        }
      }
    }

    // If local paths aren't reachable, generate high-quality synthetic studio photos
    if (photosToLoad.length === 0) {
      const palettes = [
        ['#1e1b4b', '#4338ca'],
        ['#0f172a', '#0284c7'],
        ['#1c1917', '#d97706'],
        ['#14532d', '#15803d'],
        ['#4c0519', '#be123c'],
        ['#312e81', '#6366f1'],
        ['#2e1065', '#9333ea'],
        ['#1e293b', '#64748b']
      ];

      const demoTitles = [
        { t: 'Bridal Portrait', a: 0.67 },
        { t: 'First Glance', a: 1.5 },
        { t: 'Exchange of Vows', a: 1.5 },
        { t: 'The Grand Entrance', a: 0.67 },
        { t: 'Ring Detail & Florals', a: 1.0 },
        { t: 'Sunset Ceremony', a: 1.5 },
        { t: 'First Dance', a: 0.67 },
        { t: 'Toast & Celebration', a: 1.5 },
        { t: 'Golden Hour Embrace', a: 0.67 },
        { t: 'Evening Reception', a: 1.5 },
        { t: 'Father of the Bride', a: 0.67 },
        { t: 'Architectural Venue', a: 1.5 }
      ];

      demoTitles.forEach((item, idx) => {
        const [cA, cB] = palettes[idx % palettes.length];
        photosToLoad.push(this.createSyntheticPhoto(item.t, item.a, cA, cB));
      });
    }

    albumState.addPhotos(photosToLoad);
    return photosToLoad.length;
  }

  static _testImageSrc(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SampleLoader;
} else {
  window.SampleLoader = SampleLoader;
}
