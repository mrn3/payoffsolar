/**
 * Test script to verify image resizing functionality
 * This script creates a test HTML page to manually test the image resize utility
 */

const fs = require('fs');
const path = require('path');

const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Resize Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .upload-area {
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            cursor: pointer;
        }
        .upload-area:hover {
            border-color: #999;
        }
        .results {
            margin-top: 20px;
        }
        .image-comparison {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .image-info {
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
            flex: 1;
            min-width: 300px;
        }
        .image-preview {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            margin: 10px 0;
        }
        .file-info {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
        }
        .processing {
            color: #007bff;
            font-weight: bold;
        }
        .error {
            color: #dc3545;
            background: #f8d7da;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>Image Resize Test</h1>
    <p>This page tests the client-side image resizing functionality.</p>
    
    <div class="upload-area" onclick="document.getElementById('fileInput').click()">
        <p>Click here or drag and drop images to test resizing</p>
        <p style="font-size: 12px; color: #666;">Supports JPEG, PNG, WebP</p>
    </div>
    
    <input type="file" id="fileInput" multiple accept="image/*" style="display: none;">
    
    <div id="results" class="results"></div>

    <script>
        // Image resizing utility function (copied from the React component)
        const resizeImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
            return new Promise((resolve) => {
                if (!file.type.startsWith('image/')) {
                    resolve(file);
                    return;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    try {
                        let { width, height } = img;
                        
                        // Only resize if image is larger than target dimensions
                        if (width <= maxWidth && height <= maxHeight) {
                            resolve(file);
                            return;
                        }
                        
                        // Calculate scaling factor
                        const scaleX = maxWidth / width;
                        const scaleY = maxHeight / height;
                        const scale = Math.min(scaleX, scaleY);
                        
                        // Calculate new dimensions
                        const newWidth = Math.round(width * scale);
                        const newHeight = Math.round(height * scale);
                        
                        // Set canvas dimensions
                        canvas.width = newWidth;
                        canvas.height = newHeight;
                        
                        // Draw and resize image with high quality
                        if (ctx) {
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.drawImage(img, 0, 0, newWidth, newHeight);
                        }
                        
                        // Convert canvas to blob
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const resizedFile = new File([blob], file.name, {
                                    type: file.type,
                                    lastModified: Date.now()
                                });
                                resolve(resizedFile);
                            } else {
                                resolve(file);
                            }
                        }, file.type, quality);
                        
                    } catch (error) {
                        console.warn('Error during image resize:', error);
                        resolve(file);
                    }
                };
                
                img.onerror = (error) => {
                    console.warn('Error loading image for resize:', error);
                    resolve(file);
                };
                
                const objectUrl = URL.createObjectURL(file);
                img.src = objectUrl;
                
                // Clean up object URL after image loads
                const originalOnload = img.onload;
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    originalOnload();
                };
            });
        };

        // Get image dimensions
        const getImageDimensions = (file) => {
            return new Promise((resolve, reject) => {
                if (!file.type.startsWith('image/')) {
                    reject(new Error('File is not an image'));
                    return;
                }

                const img = new Image();
                
                img.onload = () => {
                    resolve({
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    });
                    URL.revokeObjectURL(img.src);
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                    URL.revokeObjectURL(img.src);
                };
                
                img.src = URL.createObjectURL(file);
            });
        };

        // Format file size
        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        // Handle file selection
        const handleFiles = async (files) => {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<div class="processing">Processing images...</div>';

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    // Get original dimensions
                    const originalDimensions = await getImageDimensions(file);
                    
                    // Resize image
                    const resizedFile = await resizeImage(file);
                    
                    // Get resized dimensions
                    const resizedDimensions = await getImageDimensions(resizedFile);
                    
                    // Create comparison display
                    const comparisonDiv = document.createElement('div');
                    comparisonDiv.className = 'image-comparison';
                    
                    // Original image info
                    const originalDiv = document.createElement('div');
                    originalDiv.className = 'image-info';
                    originalDiv.innerHTML = \`
                        <h3>Original</h3>
                        <img class="image-preview" src="\${URL.createObjectURL(file)}" alt="Original">
                        <div class="file-info">
                            <div>Dimensions: \${originalDimensions.width} × \${originalDimensions.height}</div>
                            <div>File Size: \${formatFileSize(file.size)}</div>
                            <div>Type: \${file.type}</div>
                        </div>
                    \`;
                    
                    // Resized image info
                    const resizedDiv = document.createElement('div');
                    resizedDiv.className = 'image-info';
                    resizedDiv.innerHTML = \`
                        <h3>Resized</h3>
                        <img class="image-preview" src="\${URL.createObjectURL(resizedFile)}" alt="Resized">
                        <div class="file-info">
                            <div>Dimensions: \${resizedDimensions.width} × \${resizedDimensions.height}</div>
                            <div>File Size: \${formatFileSize(resizedFile.size)}</div>
                            <div>Type: \${resizedFile.type}</div>
                            <div>Size Reduction: \${Math.round((1 - resizedFile.size / file.size) * 100)}%</div>
                        </div>
                    \`;
                    
                    comparisonDiv.appendChild(originalDiv);
                    comparisonDiv.appendChild(resizedDiv);
                    
                    if (i === 0) {
                        resultsDiv.innerHTML = '';
                    }
                    resultsDiv.appendChild(comparisonDiv);
                }
            } catch (error) {
                resultsDiv.innerHTML = \`<div class="error">Error processing images: \${error.message}</div>\`;
            }
        };

        // Set up event listeners
        document.getElementById('fileInput').addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });

        // Drag and drop support
        const uploadArea = document.querySelector('.upload-area');
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#007bff';
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
            
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        });
    </script>
</body>
</html>
`;

// Write the test file
const testFilePath = path.join(__dirname, '..', 'public', 'test-image-resize.html');

try {
    fs.writeFileSync(testFilePath, testHtml);
    console.log('✅ Test file created successfully!');
    console.log('📁 Location:', testFilePath);
    console.log('🌐 Open in browser: http://localhost:6660/test-image-resize.html');
    console.log('');
    console.log('Instructions:');
    console.log('1. Start the development server: yarn dev');
    console.log('2. Open the test page in your browser');
    console.log('3. Upload some images to test the resizing functionality');
    console.log('4. Compare original vs resized images');
} catch (error) {
    console.error('❌ Error creating test file:', error.message);
}
