// CONFIG CONSTANTS
const VIDEO_TYPE_UPLOADED = 'UPLOADED_VIDEO';
const VIDEO_TYPE_DEFAULT = 'DEFAULT_VID';
const ANIMATION_TYPE_RANDOM = 'Random Text';
const ANIMATION_TYPE_USER = 'User Text';
const FONT_FAMILY = 'Helvetica';
const GRADIENT_CHARS = '____``..--^^~~<>??123456789%%&&@@';
const VIDEO_FPS = 12;
const MAX_CANVAS_WIDTH = 1080;
const DEFAULT_CANVAS_WIDTH = 1080;
const DEFAULT_CANVAS_HEIGHT = 1920;
// const RANDOM_STRING = 'Tw%T8bWYmCLf2BHtnf6L';
const RANDOM_STRING = 'SAVAGE:';

// Oscillation function
function oscillateByVideoTime(
  minValue,
  maxValue,
  periodSeconds,
  timeOffset = 0
) {
  const currentVideo =
    videoType === VIDEO_TYPE_UPLOADED ? userVideo : defaultVideo;
  const videoTime = currentVideo.currentTime; // Use video time instead of real time
  const adjustedTime = videoTime + timeOffset;
  const phase = (adjustedTime % periodSeconds) / periodSeconds; // 0 to 1
  const oscillationValue = Math.sin(phase * 2 * Math.PI); // -1 to 1
  const normalizedValue = (oscillationValue + 1) / 2; // 0 to 1
  return minValue + normalizedValue * (maxValue - minValue);
}

const lyrics = [
  // { time: 208.33, word: "I'll_" },
  // { time: 416.67, word: 'give_' },
  // { time: 666.67, word: 'it_' },
  // { time: 833.33, word: 'to_' },
  // { time: 1000, word: 'you_' },
  // { time: 1208.33, word: 'straight_' },
  // { time: 1958.33, word: 'I_' },
  // { time: 2208.33, word: 'think_' },
  // { time: 2458.33, word: 'that_' },
  // { time: 2625, word: 'you_' },
  // { time: 2791.67, word: 'should_' },
  // { time: 3000, word: 'know_' },
  // { time: 3791.67, word: "you're_" },
  // { time: 4000, word: 'gonna_' },
  // { time: 4333.33, word: 'find_' },
  // { time: 4833.33, word: 'out_' },
  // { time: 5208.33, word: "she's_" },
  // { time: 5500, word: 'a_' },
  // { time: 5708.33, word: 'savage_' },
  // { time: 6208.33, word: 'on_' },
  // { time: 6458.33, word: 'the_' },
  // { time: 6583.33, word: 'floor_' },
  // { time: 7291.67, word: 'so_' },
  // { time: 7541.67, word: 'turn_' },
  // { time: 7791.67, word: 'the_' },
  // { time: 8041.67, word: 'lights_' },
  // { time: 8458.33, word: 'out_' },
  // { time: 8916.67, word: 'pull_' },
  // { time: 9125, word: 'the_' },
  // { time: 9250, word: 'shades_' },
  // { time: 9625, word: 'and_' },
  // { time: 9750, word: 'lock_' },
  // { time: 9958.33, word: 'the_' },
  // { time: 10250, word: 'door_' },
  // { time: 10958.33, word: 'you_' },
  // { time: 11208.33, word: 'better_' },
  // { time: 11625, word: 'stand_' },
  // { time: 12083.33, word: 'back_' },
  // { time: 12416.67, word: "she's_" },
  // { time: 12708.33, word: 'a_' },
  // { time: 12916.67, word: 'savage_' },
  // { time: 13416.67, word: 'on_' },
  // { time: 13666.67, word: 'the_' },
  // { time: 13833.33, word: 'floor_' },
  { time: 15000, word: 'SAVAGE:' },
];

const userVideo = document.getElementById('userVideo');
const defaultVideo = document.getElementById('defaultVideo');

// Final animation canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Canvas for raw still images from video
const canvasRaw = document.getElementById('canvas-video');
const ctx2 = canvasRaw.getContext('2d', {
  willReadFrequently: true,
});

// canvas for pixelated grayscale images
const canvasPixel = document.getElementById('canvas-video-pixel');
const ctx3 = canvasPixel.getContext('2d');

let canvasWidth = DEFAULT_CANVAS_WIDTH;
let canvasHeight = DEFAULT_CANVAS_HEIGHT;

let pixelSize;
let numCols;
let numRows;
const alpha = 1;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

const effectWidthInput = document.getElementById('effectWidthInput');
effectWidthInput.style.width = canvasWidth;
let effectWidth = Number(effectWidthInput.value) / 100;
effectWidthInput.addEventListener('change', refresh);
const effectWidthLabel = document.getElementById('effectWidthLabel');

let videoPixels = [];
let grayscaleDataArray = [];

let fontSize;

// this defines the character set. ordered by darker to lighter colour
const preparedGradient = GRADIENT_CHARS.replaceAll('_', '\u00A0');

let randomColumnArray = [];
let startingRowArray = [];

let animationRequest;
let playAnimationToggle = false;
let counter = 0;

let mediaRecorder;
let recordedChunks;
let finishedBlob;
const recordingMessageDiv = document.getElementById('videoRecordingMessageDiv');
let recordVideoState = false;
let videoRecordInterval;
let videoEncoder;
let muxer;
let frameNumber = 0;
let waitingToRecord = false;
let autoStopRecording = false;
let isRecording = false;

// Lyrics synchronization variables
let currentLyricsIndex = 0;
let accumulatedLyrics = '';
let initialRandomText = RANDOM_STRING;

// Function to update lyrics based on video time
function updateLyricsSync() {
  let currentVideo =
    videoType === VIDEO_TYPE_UPLOADED ? userVideo : defaultVideo;
  let currentTime = currentVideo.currentTime * 1000; // Convert to milliseconds

  // Check if video has looped (current time is less than previous expected time)
  if (
    currentLyricsIndex > 0 &&
    currentTime < lyrics[currentLyricsIndex - 1].time
  ) {
    resetLoop();
  }

  // Check if we need to update to the next lyric
  if (
    currentLyricsIndex < lyrics.length &&
    currentTime >= lyrics[currentLyricsIndex].time
  ) {
    obj.textInput = lyrics[currentLyricsIndex].word;
    textInput = lyrics[currentLyricsIndex].word;
    currentLyricsIndex++;
  }
}

// CREATE USER GUI MENU
const obj = {
  backgroundColor: '#000000',
  backgroundGradient: false,
  backgroundSaturation: 17,
  fontColor: '#ff0000',
  fontColor2: '#ff0000',
  fontSizeFactor: 5,
  pixelSizeFactor: 60,
  threshold: 0,
  textInput: initialRandomText, // Start with random text
  randomness: 5,
  invert: false,
  animationType: ANIMATION_TYPE_USER,
};

let videoType = VIDEO_TYPE_DEFAULT;
let animationType = obj.animationType;
let backgroundColor = obj.backgroundColor;
let backgroundRGB = hexToRgb(backgroundColor);
let backgroundHue = getHueFromHex(backgroundColor);
let backgroundSaturation = obj.backgroundSaturation;

let backgroundGradient = obj.backgroundGradient;
let fontSizeFactor = obj.fontSizeFactor;
let pixelSizeFactor = obj.pixelSizeFactor;
let fontColor = obj.fontColor;
let fontHue = getHueFromHex(fontColor);
let fontColor2 = obj.fontColor2;

let threshold = obj.threshold / 100;
let textInput = obj.textInput;
let randomness = obj.randomness / 100;
let invertToggle = obj.invert;

const gui = new dat.gui.GUI({ autoPlace: false });
gui.close();
let guiOpenToggle = false;

obj['selectVideo'] = function () {
  videoType = VIDEO_TYPE_UPLOADED;
  fileInput.click();
};
gui.add(obj, 'selectVideo').name('Upload Video');

gui
  .addColor(obj, 'backgroundColor')
  .name('Background Color')
  .onFinishChange(refresh);
gui.add(obj, 'backgroundGradient').name('Bg Gradient?').onChange(refresh);
gui
  .add(obj, 'backgroundSaturation')
  .min(0)
  .max(100)
  .step(1)
  .name('Bg Saturation')
  .onChange(refresh);
gui.addColor(obj, 'fontColor').name('Font Color').onFinishChange(refresh);
gui.addColor(obj, 'fontColor2').name('Font Color2').onFinishChange(refresh);

gui
  .add(obj, 'fontSizeFactor')
  .min(0)
  .max(10)
  .step(1)
  .name('Font Size Factor')
  .onChange(refresh);
gui
  .add(obj, 'pixelSizeFactor')
  .min(10)
  .max(200)
  .step(1)
  .name('Resolution')
  .onChange(refresh);
gui
  .add(obj, 'threshold')
  .min(0)
  .max(95)
  .step(1)
  .name('Threshold')
  .onChange(refresh);
gui.add(obj, 'invert').name('Invert?').onChange(refresh);
gui
  .add(obj, 'randomness')
  .min(0)
  .max(100)
  .step(1)
  .name('Randomness')
  .onChange(refresh);

gui
  .add(obj, 'animationType', [ANIMATION_TYPE_RANDOM, ANIMATION_TYPE_USER])
  .name('Text Type')
  .onChange(refresh);
gui.add(obj, 'textInput').onFinishChange(refresh);

obj['pausePlay'] = function () {
  togglePausePlay();
};
gui.add(obj, 'pausePlay').name('Pause/Play');

obj['saveImage'] = function () {
  saveImage();
};
gui.add(obj, 'saveImage').name('Image Export');

obj['saveVideo'] = function () {
  startAutoVideoRecord();
};
gui.add(obj, 'saveVideo').name('Record Full Loop');

const customContainer = document.getElementById('gui');
customContainer.appendChild(gui.domElement);

const guiCloseButton = document.getElementsByClassName('close-button');
console.log(guiCloseButton.length);
guiCloseButton[0].addEventListener('click', updateGUIState);

// Helper function to set canvas dimensions based on video
function setCanvasDimensionsFromVideo(video) {
  canvasWidth = Math.min(video.videoWidth, MAX_CANVAS_WIDTH);
  canvasHeight = Math.floor(
    canvasWidth * (video.videoHeight / video.videoWidth)
  );

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  console.log(
    `Canvas dimensions set to: ${canvasWidth} x ${canvasHeight} from video: ${video.videoWidth} x ${video.videoHeight}`
  );
}

// turn video input into still images, and then into pixelated grayscale values
const render = (ctx) => {
  if (canvasWidth && canvasHeight) {
    canvasRaw.width = canvasWidth;
    canvasRaw.height = canvasHeight;

    // choose video feed
    if (videoType == VIDEO_TYPE_UPLOADED) {
      ctx2.drawImage(userVideo, 0, 0, canvasWidth, canvasHeight);
    } else if (videoType == VIDEO_TYPE_DEFAULT) {
      ctx2.drawImage(defaultVideo, 0, 0, canvasWidth, canvasHeight);
    }

    const pixelData = ctx2.getImageData(0, 0, canvasWidth, canvasHeight);
    const pixels = pixelData.data;

    // new canvas with a pixelated image
    canvasPixel.width = canvasWidth;
    canvasPixel.height = canvasHeight;
    videoPixels = [];
    grayscaleDataArray = [];

    for (let cellY = 0; cellY < numRows; cellY++) {
      grayscaleDataArray[cellY] = [];

      for (let cellX = 0; cellX < numCols; cellX++) {
        const cellPixels = [];

        for (let pixelY = 0; pixelY < pixelSize; pixelY++) {
          for (let pixelX = 0; pixelX < pixelSize; pixelX++) {
            const currentXPosition = cellX * pixelSize + pixelX;
            const currentYPosition = cellY * pixelSize + pixelY;

            const currentPixelDataValue =
              (currentYPosition * canvasWidth + currentXPosition) * 4;

            if (
              currentXPosition < canvasWidth &&
              currentYPosition < canvasHeight
            ) {
              cellPixels.push(pixels[currentPixelDataValue]);
              cellPixels.push(pixels[currentPixelDataValue + 1]);
              cellPixels.push(pixels[currentPixelDataValue + 2]);
              cellPixels.push(pixels[currentPixelDataValue + 3]);
            }
          }
        }

        const avgColor = getAverageColor(cellPixels);

        const grayScaleValue =
          0.299 * avgColor[0] + 0.587 * avgColor[1] + 0.114 * avgColor[2]; // perceived luminosity value
        grayscaleDataArray[cellY][cellX] = grayScaleValue;
      }
    }
  } else {
    ctx2.fillStyle = '#fff';
    ctx2.fillRect(0, 0, canvasWidth, canvasHeight);
  }
};

const getCharByScale = (scale) => {
  const val = Math.floor((scale / 255) * (GRADIENT_CHARS.length - 1));
  return preparedGradient[val];
};
// draw the text and background color for each frame onto the final canvas
function renderText() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth * effectWidth, canvasHeight);

  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < numRows; row++) {
      const adjustedThreshold =
        threshold + 0.2 * Math.sin(counter / 30) * randomness;
      const currentGrayValue = grayscaleDataArray[row][col];

      let char;
      let currentFontSize = Math.min(
        fontSize * 3,
        (fontSize * fontSizeFactor) / 3
      );

      // draw background color of pixels
      if (counter % 8 == 0 && Math.random() < randomness * 0.002) {
        ctx.fillStyle = tweakHexColor(backgroundColor, 100 * randomness);
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      } else if (backgroundGradient) {
        const currentBackgroundColor = `hsl(${backgroundHue},${backgroundSaturation}%,${
          Math.pow(currentGrayValue / 255, 2) * 100
        }%)`;
        const currentBackgroundColorInvert = `hsl(${backgroundHue},${backgroundSaturation}%,${
          (1 - Math.pow(currentGrayValue / 255, 2)) * 100
        }%)`;

        if (invertToggle == false) {
          if (currentGrayValue / 255 > adjustedThreshold) {
            ctx.fillStyle = currentBackgroundColor;
          } else {
            ctx.fillStyle = `hsl(${backgroundHue},${backgroundSaturation}%,${
              (adjustedThreshold / 4) * 100
            }%)`;
          }
        } else {
          if (currentGrayValue / 255 < 1 - adjustedThreshold) {
            ctx.fillStyle = currentBackgroundColorInvert;
          } else {
            ctx.fillStyle = `hsl(${backgroundHue},${backgroundSaturation}%,${
              (adjustedThreshold / 4) * 100
            }%)`;
          }
        }

        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }

      // choose text character to draw
      if (randomColumnArray[col]) {
        if (
          (((counter + startingRowArray[col]) % 100) / 100) * numRows +
            startingRowArray[col] >
          row
        ) {
          char = getCharByScale(currentGrayValue);
        } else {
          char = '';
        }
      } else if (Math.random() < 0.005 * randomness) {
        char =
          preparedGradient[Math.floor(Math.random() * preparedGradient.length)]; // draw random char
      } else if (animationType == ANIMATION_TYPE_RANDOM) {
        char = getCharByScale(currentGrayValue);
      } else if (animationType == ANIMATION_TYPE_USER) {
        char = textInput[(row * numCols + col) % textInput.length];
        if (invertToggle) {
          currentFontSize = Math.min(
            fontSize * 3,
            Math.floor(
              (((1 - Math.pow(currentGrayValue / 255, 1)) * fontSizeFactor) /
                3) *
                fontSize
            )
          );
        } else {
          currentFontSize = Math.min(
            fontSize * 3,
            Math.floor(
              ((Math.pow(currentGrayValue / 255, 1) * fontSizeFactor) / 3) *
                fontSize
            )
          );
        }
      }

      // Apply randomness to font size
      const fontSizeVariation = 1 + (Math.random() - 0.5) * randomness * 0.5;
      currentFontSize = Math.max(
        1,
        Math.floor(currentFontSize * fontSizeVariation)
      );

      // draw text onto canvas
      ctx.font = `${currentFontSize}px ${FONT_FAMILY}`;

      if (invertToggle == false) {
        if (currentGrayValue / 255 > adjustedThreshold) {
          ctx.fillStyle = interpolateHex(
            fontColor,
            fontColor2,
            (currentGrayValue / 255 - adjustedThreshold) /
              (1 - adjustedThreshold)
          );
          ctx.fillText(char, col * pixelSize, row * pixelSize + pixelSize);
        }
      } else {
        if (currentGrayValue / 255 < 1 - adjustedThreshold) {
          ctx.fillStyle = interpolateHex(
            fontColor2,
            fontColor,
            currentGrayValue / 255 / (1 - adjustedThreshold)
          );
          ctx.fillText(char, col * pixelSize, row * pixelSize + pixelSize);
        }
      }
    }
  }
}

// animation loop to go frame by frame
function loop() {
  if (counter == 0) {
    console.log('start animation, first frame');

    // Check if we're waiting to start recording and video just restarted
    if (waitingToRecord) {
      waitingToRecord = false;
      recordVideoState = true;
      isRecording = true;
      recordVideoMuxer();
      console.log('Video loop restarted - beginning recording');
    }
  }

  if (playAnimationToggle) {
    counter++;

    // Update lyrics synchronization
    updateLyricsSync();

    // Use video-time based oscillation instead of real-time
    pixelSizeFactor = oscillateByVideoTime(10, 140, 4);

    // Recalculate pixel size and grid dimensions
    pixelSize = Math.ceil(
      Math.min(canvasWidth, canvasHeight) / pixelSizeFactor
    );
    numCols = Math.ceil(Math.ceil(canvasWidth / pixelSize) * effectWidth);
    numRows = Math.ceil(canvasHeight / pixelSize);
    fontSize = pixelSize / 0.65;

    render(ctx);

    if (effectWidth < 1) {
      // draw the chosen video onto the final canvas
      if (videoType == VIDEO_TYPE_UPLOADED) {
        ctx.drawImage(userVideo, 0, 0, canvasWidth, canvasHeight);
      } else if (videoType == VIDEO_TYPE_DEFAULT) {
        ctx.drawImage(defaultVideo, 0, 0, canvasWidth, canvasHeight);
      }
    }

    renderText();

    animationRequest = requestAnimationFrame(loop);
  }
}

// HELPER FUNCTIONS BELOW

function selectVideo() {
  videoType = VIDEO_TYPE_UPLOADED;
  fileInput.click();
}

function updateGUIState() {
  if (guiOpenToggle) {
    guiOpenToggle = false;
  } else {
    guiOpenToggle = true;
  }
}

function refresh() {
  console.log('refresh');
  console.log(`canvas width/height: ${canvasWidth}, ${canvasHeight}`);

  document
    .getElementById('canvasDiv')
    .setAttribute('style', `width: ${canvasWidth}px;`);
  effectWidth = Number(effectWidthInput.value) / 100;
  effectWidthLabel.innerHTML = `Effect Width: ${Math.round(
    effectWidth * 100
  )}%`;

  animationType = obj.animationType;
  fontSizeFactor = obj.fontSizeFactor;
  pixelSizeFactor = obj.pixelSizeFactor;
  pixelSize = Math.ceil(Math.min(canvasWidth, canvasHeight) / pixelSizeFactor);
  numCols = Math.ceil(Math.ceil(canvasWidth / pixelSize) * effectWidth);
  numRows = Math.ceil(canvasHeight / pixelSize);
  fontSize = pixelSize / 0.65;
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;

  fontColor = obj.fontColor;
  fontColor2 = obj.fontColor2;
  fontHue = getHueFromHex(fontColor);

  backgroundColor = obj.backgroundColor;
  backgroundRGB = hexToRgb(backgroundColor);
  backgroundHue = getHueFromHex(backgroundColor);
  backgroundSaturation = obj.backgroundSaturation;

  backgroundGradient = obj.backgroundGradient;
  threshold = obj.threshold / 100;
  textInput = obj.textInput;
  counter = 0;
  randomness = obj.randomness / 100;
  invertToggle = obj.invert;
  randomColumnArray = [];
  startingRowArray = [];

  for (let i = 0; i < numCols; i++) {
    if (Math.random() < randomness) {
      randomColumnArray[i] = true;
      startingRowArray[i] = Math.floor(Math.random() * numRows);
    } else {
      randomColumnArray[i] = false;
    }
  }
}

function resetLoop() {
  currentLyricsIndex = 0;
  accumulatedLyrics = '';
  obj.textInput = RANDOM_STRING;
  textInput = RANDOM_STRING;
  counter = 0;
}

function togglePausePlay() {
  if (playAnimationToggle == false) {
    if (videoType == VIDEO_TYPE_UPLOADED) {
      refresh();
      userVideo.play();
      playAnimationToggle = true;
      animationRequest = requestAnimationFrame(loop);
    } else if (videoType == VIDEO_TYPE_DEFAULT) {
      startDefaultVideo();
    }
  } else {
    stopVideo();
  }
}

function changeVideoType() {
  stopVideo();

  if (videoType == VIDEO_TYPE_UPLOADED) {
    console.log('select video file');
    selectVideo();
  } else if (videoType == VIDEO_TYPE_DEFAULT) {
    startDefaultVideo();
  }

  refresh();
}

function startDefaultVideo() {
  if (playAnimationToggle == true) {
    playAnimationToggle = false;
    cancelAnimationFrame(animationRequest);
    console.log('cancel animation');
  }

  // Reset lyrics synchronization when starting video
  resetLoop();

  // Set canvas dimensions from default video
  if (defaultVideo.videoWidth && defaultVideo.videoHeight) {
    setCanvasDimensionsFromVideo(defaultVideo);
  }

  defaultVideo.loop = true; // Ensure video loops
  defaultVideo.play();
  refresh();
  playAnimationToggle = true;
  animationRequest = requestAnimationFrame(loop);
}

let localStream;
function stopVideo() {
  if (playAnimationToggle == true) {
    playAnimationToggle = false;
    cancelAnimationFrame(animationRequest);
    console.log('cancel animation');
  }

  userVideo.pause();
  defaultVideo.pause();
}

const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (e) => {
  if (playAnimationToggle == true) {
    playAnimationToggle = false;
    cancelAnimationFrame(animationRequest);
    console.log('cancel animation');
  }

  videoType = VIDEO_TYPE_UPLOADED;

  // Reset lyrics synchronization for uploaded video
  resetLoop();

  const file = e.target.files[0];
  const url = URL.createObjectURL(file);
  userVideo.src = url;
  userVideo.addEventListener('loadedmetadata', () => {
    userVideo.width = userVideo.videoWidth;
    userVideo.height = userVideo.videoHeight;
    console.log(
      `user video width/height: ${userVideo.width}, ${userVideo.height}`
    );

    setCanvasDimensionsFromVideo(userVideo);
  });

  setTimeout(function () {
    userVideo.loop = true; // Ensure uploaded video loops
    userVideo.play();
    refresh();
    playAnimationToggle = true;
    animationRequest = requestAnimationFrame(loop);
  }, 2000);
});

// Add event listener for default video metadata
defaultVideo.addEventListener('loadedmetadata', () => {
  console.log(
    `default video width/height: ${defaultVideo.videoWidth}, ${defaultVideo.videoHeight}`
  );
  setCanvasDimensionsFromVideo(defaultVideo);
});

// Add event listeners for video loop events
defaultVideo.addEventListener('ended', () => {
  console.log('Default video ended, resetting lyrics');
  resetLoop();
});

userVideo.addEventListener('ended', () => {
  console.log('User video ended, resetting lyrics');
  resetLoop();
});

// Add seeked event listeners to handle manual seeking
defaultVideo.addEventListener('seeked', () => {
  console.log('Default video seeked, checking lyrics sync');
  resetLoop();
});

userVideo.addEventListener('seeked', () => {
  console.log('User video seeked, checking lyrics sync');
  resetLoop();
});

function getAverageColor(chosenPixels) {
  let r = 0;
  let g = 0;
  let b = 0;
  const count = chosenPixels.length / 4;
  for (let i = 0; i < count; i++) {
    r += chosenPixels[i * 4];
    g += chosenPixels[i * 4 + 1];
    b += chosenPixels[i * 4 + 2];
  }
  return [r / count, g / count, b / count];
}

function getHueFromHex(hex) {
  const rgb = hexToRgb(hex);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;

  if (delta === 0) {
    hue = 0;
  } else if (max === r) {
    hue = (g - b) / delta;
  } else if (max === g) {
    hue = 2 + (b - r) / delta;
  } else {
    hue = 4 + (r - g) / delta;
  }

  hue *= 60;
  if (hue < 0) {
    hue += 360;
  }

  return hue;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHue(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const hue = Math.atan2(
    Math.sqrt(3) * (gNorm - bNorm),
    2 * rNorm - gNorm - bNorm
  );
  return (hue * 180) / Math.PI;
}

function rgbToSaturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max - min) / max;
}

function rgbToLightness(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max + min) / 2 / 255;
}

function interpolateHex(hex1, hex2, factor) {
  const hex1RGB = hexToRgb(hex1);
  const hex2RGB = hexToRgb(hex2);

  const newR = Math.round(hex1RGB.r + (hex2RGB.r - hex1RGB.r) * factor);
  const newG = Math.round(hex1RGB.g + (hex2RGB.g - hex1RGB.g) * factor);
  const newB = Math.round(hex1RGB.b + (hex2RGB.b - hex1RGB.b) * factor);

  const rgbResult = `rgb(${newR},${newG},${newB})`;
  return rgbResult;
}

function tweakHexColor(hexColor, range) {
  const rgb = hexToRgb(hexColor);

  const newRGBArray = [];

  newRGBArray.push(Math.floor(rgb.r + range * Math.random() - range / 2));
  newRGBArray.push(Math.floor(rgb.b + range * Math.random() - range / 2));
  newRGBArray.push(Math.floor(rgb.g + range * Math.random() - range / 2));

  const newHexColor = rgbToHex(newRGBArray[0], newRGBArray[1], newRGBArray[2]);
  return newHexColor;
}

function rgbToHex(r, g, b) {
  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function saveImage() {
  const link = document.createElement('a');
  link.href = canvas.toDataURL();

  const date = new Date();
  const filename = `ASCII_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.png`;
  link.download = filename;
  link.click();
}

function toggleGUI() {
  if (guiOpenToggle == false) {
    gui.open();
    guiOpenToggle = true;
  } else {
    gui.close();
    guiOpenToggle = false;
  }
}

function startAutoVideoRecord() {
  if (waitingToRecord || recordVideoState) {
    console.log('Already recording or waiting to record');
    return;
  }

  waitingToRecord = true;
  autoStopRecording = true;

  console.log('Waiting for video to restart loop before recording...');
  recordingMessageDiv.innerHTML = 'Waiting for video loop to restart...';
  recordingMessageDiv.classList.remove('hidden');

  // Reset video to beginning and wait for it to restart
  const currentVideo =
    videoType === VIDEO_TYPE_UPLOADED ? userVideo : defaultVideo;
  currentVideo.currentTime = 0;

  // Reset lyrics when preparing to record
  resetLoop();
}

function toggleVideoRecord() {
  userVideo.currentTime = 0;
  defaultVideo.currentTime = 0;

  // Reset lyrics when starting video recording
  resetLoop();

  setTimeout(function () {
    if (recordVideoState == false) {
      recordVideoState = true;
      recordVideoMuxer();
    } else {
      recordVideoState = false;
      finalizeVideo();
    }
  }, 250);
}

// record html canvas element and export as mp4 video
// source: https://devtails.xyz/adam/how-to-save-html-canvas-to-mp4-using-web-codecs-api
async function recordVideoMuxer() {
  console.log('start muxer video recording');
  const videoWidth = Math.floor(canvas.width / 2) * 2;
  const videoHeight = Math.floor(canvas.height / 8) * 8;
  console.log(`Video dimensions: ${videoWidth}, ${videoHeight}`);

  frameNumber = 0;
  isRecording = true;

  // Get video duration for frame calculation
  const currentVideo =
    videoType === VIDEO_TYPE_UPLOADED ? userVideo : defaultVideo;
  const videoDuration = currentVideo.duration;
  const totalFrames = Math.ceil(videoDuration * VIDEO_FPS);

  console.log(
    `Recording ${totalFrames} frames for ${videoDuration}s video at ${VIDEO_FPS}fps`
  );

  // display user message
  recordingMessageDiv.innerHTML = `Recording video loop... (0/${totalFrames} frames)`;
  recordingMessageDiv.classList.remove('hidden');

  recordVideoState = true;
  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
    desynchronized: true,
  });

  muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: videoWidth,
      height: videoHeight,
    },
    firstTimestampBehavior: 'offset',
    fastStart: 'in-memory',
  });

  videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error(e),
  });

  videoEncoder.configure({
    codec: 'avc1.42003e',
    width: videoWidth,
    height: videoHeight,
    bitrate: 14_000_000,
    bitrateMode: 'constant',
  });

  // Record frames by seeking to specific timestamps
  await recordFrameByFrame(currentVideo, totalFrames, videoDuration);
}

async function recordFrameByFrame(video, totalFrames, videoDuration) {
  // Pause the normal animation loop during recording
  const wasPlaying = playAnimationToggle;
  playAnimationToggle = false;
  cancelAnimationFrame(animationRequest);

  for (let frame = 0; frame < totalFrames; frame++) {
    // Calculate exact timestamp for this frame
    const timestamp = frame / VIDEO_FPS;

    // Seek video to exact timestamp
    video.currentTime = timestamp;

    // Wait for seek to complete
    await new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });

    // Update counter based on frame position for consistent randomness
    counter = frame;

    // Update lyrics synchronization for this timestamp
    updateLyricsSync();

    // Calculate oscillation based on video time (not real time)
    pixelSizeFactor = oscillateByVideoTime(10, 140, 4);

    // Recalculate grid dimensions
    pixelSize = Math.ceil(
      Math.min(canvasWidth, canvasHeight) / pixelSizeFactor
    );
    numCols = Math.ceil(Math.ceil(canvasWidth / pixelSize) * effectWidth);
    numRows = Math.ceil(canvasHeight / pixelSize);
    fontSize = pixelSize / 0.65;

    // Render this frame
    render(ctx);

    if (effectWidth < 1) {
      ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
    }

    renderText();

    // Encode this frame
    await renderCanvasToVideoFrameAndEncode({
      canvas,
      videoEncoder,
      frameNumber: frame,
      videofps: VIDEO_FPS,
    });

    // Update progress
    recordingMessageDiv.innerHTML = `Recording video loop... (${
      frame + 1
    }/${totalFrames} frames)`;

    // Small delay to prevent overwhelming the browser
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Restore normal playback
  if (wasPlaying) {
    video.currentTime = 0;
    resetLoop();
    playAnimationToggle = true;
    animationRequest = requestAnimationFrame(loop);
  }

  // Finalize recording
  autoStopRecording = false;
  recordVideoState = false;
  isRecording = false;
  await finalizeVideo();
}

// finish and export video
async function finalizeVideo() {
  console.log('finalize muxer video');
  clearInterval(videoRecordInterval);
  recordVideoState = false;
  // Forces all pending encodes to complete
  await videoEncoder.flush();
  muxer.finalize();
  const buffer = muxer.target.buffer;
  finishedBlob = new Blob([buffer]);
  downloadBlob(new Blob([buffer]));

  // hide user message
  recordingMessageDiv.classList.add('hidden');
}

async function renderCanvasToVideoFrameAndEncode({
  canvas,
  videoEncoder,
  frameNumber,
  videofps,
}) {
  const frame = new VideoFrame(canvas, {
    // Equally spaces frames out depending on frames per second
    timestamp: (frameNumber * 1e6) / videofps,
  });

  // The encode() method of the VideoEncoder interface asynchronously encodes a VideoFrame
  videoEncoder.encode(frame);

  // The close() method of the VideoFrame interface clears all states and releases the reference to the media resource.
  frame.close();
}

function downloadBlob() {
  console.log('download video');
  const url = window.URL.createObjectURL(finishedBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  const date = new Date();
  const filename = `ASCII_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.mp4`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

// MAIN METHOD
refresh();
startDefaultVideo();
