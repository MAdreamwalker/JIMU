import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath = path.resolve('dist-electron/main.js');

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, "import './electron/main.js';\n", 'utf8');
