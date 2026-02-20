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
                { src: 'float32.tflite', dest: 'float32.tflite' },
                { src: 'labels.txt', dest: 'labels.txt' }
            ];

            filesToCopy.forEach(file => {
                // Try multiple potential source locations for better monorepo support on EAS
                const potentialSources = [
                    path.join(projectRoot, 'assets', 'models', file.src),
                    path.join(projectRoot, 'progeny-mobile', 'assets', 'models', file.src),
                    path.join(process.cwd(), 'assets', 'models', file.src)
                ];

                let sourcePath = null;
                for (const p of potentialSources) {
                    if (fs.existsSync(p)) {
                        sourcePath = p;
                        break;
                    }
                }

                const destPath = path.join(assetsDir, file.dest);

                if (sourcePath) {
                    // Copy file
                    fs.copyFileSync(sourcePath, destPath);
                    console.log(`[ConfigPlugin] ✅ Copied ${file.src} from ${sourcePath} to Android assets`);
                } else {
                    console.error(`[ConfigPlugin] ❌ Source file not found in any of these locations:`);
                    potentialSources.forEach(p => console.error(`  - ${p}`));

                    // Fail build if model is missing (critical)
                    if (file.src.endsWith('.tflite')) {
                        throw new Error(`Critical asset missing: best_float16.tflite. Ensure it is placed in /assets/models/ and NOT ignored by git.`);
                    }
                }
            });

            return config;
        },
    ]);
};

module.exports = withModelAssets;
