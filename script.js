maxnumColors = 500;


const maxColorsSlider = document.getElementById("maxColors");
const maxColorsValue = document.getElementById("maxColorsValue");
const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");
const imageContainer = document.getElementById("Image");

let dropArea = document.getElementById("drop-area");

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add("highlight");
}

function unhighlight() {
    dropArea.classList.remove("highlight");
}

dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    handleFiles(files);
}

// Trigger file input click when drop area is clicked
dropArea.addEventListener("click", function () {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function (e) {
    let files = e.target.files;
    handleFiles(files);
});

function handleFiles(files) {
    if (files.length === 0) return;

    let file = files[0];
    let reader = new FileReader();

    reader.onload = function (e) {
        // Clear previously uploaded image
        document.getElementById("Image").innerHTML = "";

        // Corrected callback function call
        uploadFile(file, function (img) {
            extractColors(img, parseInt(maxColorsSlider.value), parseInt(thresholdSlider.value)); // Parse slider values as integers
        });
    };
    reader.readAsDataURL(file);
}

function extractColors(img, numColors, threshold) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let pixels = [];

    // Collect unique colors from the image
    for (let i = 0; i < imageData.length; i += 4) {
        let r = imageData[i];
        let g = imageData[i + 1];
        let b = imageData[i + 2];
        let color = [r, g, b];

        // Check if the color is significantly different from existing colors in the palette
        let addColor = true;
        for (let j = 0; j < pixels.length; j++) {
            let existingColor = pixels[j];
            let distance = Math.sqrt(
                Math.pow(color[0] - existingColor[0], 2) +
                Math.pow(color[1] - existingColor[1], 2) +
                Math.pow(color[2] - existingColor[2], 2)
            );

            // If the distance is smaller than the threshold, consider the color too similar
            if (distance < threshold) { // Adjust the threshold as needed
                addColor = false;
                break;
            }
        }

        // If the color is significantly different, add it to the palette
        if (addColor) {
            pixels.push(color);
        }

        // Break the loop if we have collected enough colors
        if (pixels.length >= numColors) {
            break;
        }
    }

    // Convert representative colors to hex format
    let colorMap = {};
    pixels.forEach((color, index) => {
        let hex = rgbToHex(color[0], color[1], color[2]);
        let rgb = color.join(', ');
        colorMap[rgb] = hex;
    });

    
    displayColors(colorMap); // Call displayColors after colors are extracted
    updateButtonEvents();
}


// Define the uploadFile function
function uploadFile(file, callback) {
    let reader = new FileReader();

    reader.onload = function (e) {
        let img = new Image();
        img.onload = function () {
            // Check if callback is a function before calling it
            if (typeof callback === 'function') {
                document.getElementById("Image").src = e.target.result;
                document.getElementById("Image").style.border = '5px solid black'; // Update the border size
                img.scrollIntoView({ behavior: 'smooth', block: 'start' });
                callback(img); // Call the callback function after the image is loaded

            } else {
                console.error("Callback is not a function");
            }
        };
        img.src = e.target.result;
        img.width = 800; // Set fixed width
        img.style.height = "auto"; // Let height scale

        document.getElementById("Image").appendChild(img);
        document.getElementById('delete-btn').disabled = false;
    };

    reader.readAsDataURL(file);
}


document.getElementById('rgb-mode').addEventListener('change', function () {
    updateButtonEvents();
});

document.getElementById('hex-mode').addEventListener('change', function () {
    updateButtonEvents();
});

function updateButtonEvents() {
    let buttons = document.querySelectorAll('.colour-btn');

    buttons.forEach(function (button, index) {
        button.removeEventListener('click', handleClick); // Remove existing event listener
        button.addEventListener('click', handleClick);
    });
}

function handleClick() {
    let mode = document.querySelector('input[name="mode"]:checked').value;
    let value;
    if (mode === 'RGB') {
        let rgbValues = this.title.match(/\d+/g).slice(0, 3);
        value = `(${rgbValues.join(', ')})`;
    } else {
        value = this.title.split('HEX: ')[1];
    }
    copyToClipboard(value);
}

function copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert("Copied to clipboard: " + text);
}

function displayColors(colors) {
    let palette = document.getElementById('palette');
    palette.innerHTML = '';
    let exportBtn = document.getElementById('export-btn');

    if (Object.keys(colors).length === 0) {
        let message = document.createElement('div');
        message.textContent = "No colors detected";
        exportBtn.disabled = true;
        palette.appendChild(message);
    } else {
        exportBtn.disabled = false;
        Object.keys(colors).forEach(function (rgb, index) {
            let hex = colors[rgb];
            let colourButton = document.createElement('button');
            colourButton.classList.add('colour-btn');
            colourButton.style.backgroundColor = hex;
            colourButton.title = `RGB: ${rgb}, HEX: ${hex}`;
            palette.appendChild(colourButton);
        });
    }
}


function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Add event listeners for max colors slider


function updateExtractedColors() {
    maxColorsValue.textContent = maxColorsSlider.value;
    thresholdValue.textContent = thresholdSlider.value;
    extractColors(imageContainer, maxColorsSlider.value, thresholdSlider.value);
}

maxColorsSlider.addEventListener("input", updateExtractedColors);
thresholdSlider.addEventListener("input", updateExtractedColors);

// Export button

document.getElementById('export-btn').addEventListener('click', function () {
    let mode = document.querySelector('input[name="mode"]:checked').value;
    let colors = [];

    document.querySelectorAll('.colour-btn').forEach(function (button) {
        let colorValue;
        if (mode === 'RGB') {
            let rgbValues = button.title.match(/\d+/g).slice(0, 3);
            colorValue = `(${rgbValues.join(', ')})`;
        } else {
            colorValue = button.title.split('HEX: ')[1];
        }
        colors.push(colorValue);
    });

    downloadPalette(colors.join('\n'), mode);
});

function downloadPalette(paletteData, mode) {
    let timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // Generate timestamp
    let filename = mode === 'RGB' ? `palette_${timestamp}_rgb.txt` : `palette_${timestamp}_hex.txt`;

    if (mode === 'RGB') {
        // Convert each RGB value to the format (x, y, z)
        paletteData = paletteData.split('\n').map(rgb => `(${rgb})`).join('\n');
    }

    let blob = new Blob([paletteData], { type: 'text/plain' });
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

document.getElementById('delete-btn').addEventListener('click', function () {
    location.reload();
});

document.getElementById('upload-btn').addEventListener('click', function () {
    document.getElementById('fileInput').click();
});
