import 'dotenv/config';

console.log('环境变量检查:');
console.log('CLOUDFLARE_ACCOUNT_ID:', process.env.CLOUDFLARE_ACCOUNT_ID);
console.log('CLOUDFLARE_DATABASE_ID:', process.env.CLOUDFLARE_DATABASE_ID);
console.log('CLOUDFLARE_D1_TOKEN:', process.env.CLOUDFLARE_D1_TOKEN);

// 打印.env文件路径
import { resolve } from 'path';
console.log('当前工作目录:', process.cwd());
console.log('.env文件路径:', resolve(process.cwd(), '.env')); 