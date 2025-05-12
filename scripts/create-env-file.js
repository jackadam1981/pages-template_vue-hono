import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// 检查.env文件是否已存在
if (fs.existsSync(envPath)) {
  console.log('警告: .env文件已存在。继续操作将覆盖现有文件。');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('是否继续? (y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('操作已取消。');
      process.exit(0);
    }
    createEnvFile();
    rl.close();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  // 定义环境变量模板
  const envTemplate = `# Cloudflare D1数据库配置
CLOUDFLARE_ACCOUNT_ID=480d718004a1a3ca022cbd36a0033aab
CLOUDFLARE_DATABASE_ID=d94b1fc3-282e-46dd-81b9-d779a1816597
CLOUDFLARE_D1_TOKEN=_ta5TgKZCkvXVQybYKjcLsAlyb4gpi4kkIQwp056
`;

  // 写入.env文件
  fs.writeFileSync(envPath, envTemplate);
  console.log('.env文件已成功创建!');
  console.log('路径:', envPath);
  console.log('注意: 这个文件包含敏感信息，请确保不要将其提交到版本控制系统中。');
} 