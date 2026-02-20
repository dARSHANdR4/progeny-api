const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withModelAssets = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;

            // Target directory: android/app/src/main/assets
            const assetsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets');

            // Ensure specific directory exists
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }

            // Define files to copy
            const filesToCopy = [
                { src: 'best_float16.tflite', dest: 'best_float16.tflite' },
                { src: 'labels.txt', dest: 'labels.txt' }
            ];

            filesToCopy.forEach(file => {
                const sourcePath = path.join(projectRoot, 'assets', 'models', file.src);
                const destPath = path.join(assetsDir, file.dest);

                if (fs.existsSync(sourcePath)) {
                    // Copy file
                    fs.copyFileSync(sourcePath, destPath);
                    console.log(`[ConfigPlugin] ✅ Copied ${file.src} to Android assets`);
                } else {
                    console.warn(`[ConfigPlugin] ⚠️ Source file not found: ${sourcePath}`);

                    // Fail build if model is missing (critical)
                    if (file.src.endsWith('.tflite')) {
                        throw new Error(`Critical asset missing: ${sourcePath}`);
                    }
                }
            });

            return config;
        },
    ]);
};

module.exports = withModelAssets;
