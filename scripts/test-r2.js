#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 创建测试文件夹
const TEST_DIR = path.join(process.cwd(), 'test-files');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// 生成随机内容
function generateRandomContent(size = 1024) {
  return crypto.randomBytes(size);
}

// 生成测试文件
function createTestFiles() {
  console.log('创建测试文件...');
  
  // 创建文本文件
  const textFilePath = path.join(TEST_DIR, 'test.txt');
  fs.writeFileSync(textFilePath, 'Hello, R2 Storage! 这是一个测试文件。\n');
  console.log(`创建了文本文件: ${textFilePath}`);
  
  // 创建JSON文件
  const jsonFilePath = path.join(TEST_DIR, 'config.json');
  const jsonContent = {
    name: 'R2测试',
    version: '1.0.0',
    features: ['存储', '检索', '删除'],
    settings: {
      maxSize: 1024 * 1024 * 50, // 50MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    }
  };
  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent, null, 2));
  console.log(`创建了JSON文件: ${jsonFilePath}`);
  
  // 创建二进制文件
  const binaryFilePath = path.join(TEST_DIR, 'random.bin');
  fs.writeFileSync(binaryFilePath, generateRandomContent(2048));
  console.log(`创建了二进制文件: ${binaryFilePath}`);
  
  return {
    textFile: textFilePath,
    jsonFile: jsonFilePath,
    binaryFile: binaryFilePath
  };
}

// 上传文件
function uploadFiles(files, production = false) {
  console.log(`上传文件到 ${production ? '生产' : '预览'} 环境...`);
  
  const bucketName = production ? 'app-files' : 'app-files-dev';
  
  // 上传文本文件
  console.log('上传文本文件...');
  execSync(`npx wrangler r2 object put ${bucketName}/test.txt --file=${files.textFile} --content-type=text/plain`, { stdio: 'inherit' });
  
  // 上传JSON文件
  console.log('上传JSON文件...');
  execSync(`npx wrangler r2 object put ${bucketName}/config.json --file=${files.jsonFile} --content-type=application/json`, { stdio: 'inherit' });
  
  // 上传二进制文件
  console.log('上传二进制文件...');
  execSync(`npx wrangler r2 object put ${bucketName}/random.bin --file=${files.binaryFile} --content-type=application/octet-stream`, { stdio: 'inherit' });
}

// 列出文件
function listFiles(production = false) {
  const bucketName = production ? 'app-files' : 'app-files-dev';
  console.log(`\n${bucketName} 中的文件:`);
  
  try {
    console.log('\nR2 API不支持直接列出对象，请使用API接口获取列表。');
    console.log('例如: GET /api/files');
    
    // 尝试获取一个已知对象的信息
    console.log('\n获取test.txt的信息:');
    execSync(`npx wrangler r2 object head ${bucketName}/test.txt`, { stdio: 'inherit' });
  } catch (error) {
    console.error('列出文件失败:', error.message);
  }
}

// 下载文件
function downloadFile(filename, production = false) {
  const bucketName = production ? 'app-files' : 'app-files-dev';
  const outputPath = path.join(TEST_DIR, `downloaded-${filename}`);
  
  console.log(`\n下载文件 ${filename} 到 ${outputPath}`);
  try {
    execSync(`npx wrangler r2 object get ${bucketName}/${filename} --file=${outputPath}`, { stdio: 'inherit' });
    console.log('下载完成!');
  } catch (error) {
    console.error('下载文件失败:', error.message);
  }
}

// 删除文件
function deleteFile(filename, production = false) {
  const bucketName = production ? 'app-files' : 'app-files-dev';
  
  console.log(`\n删除文件 ${filename}`);
  try {
    execSync(`npx wrangler r2 object delete ${bucketName}/${filename}`, { stdio: 'inherit' });
    console.log('删除完成!');
  } catch (error) {
    console.error('删除文件失败:', error.message);
  }
}

// 检查Cloudflare配置
function checkConfiguration() {
  console.log('\n检查Cloudflare配置...');
  try {
    // 检查wrangler
    console.log('wrangler版本:');
    execSync('npx wrangler --version', { stdio: 'inherit' });
    
    // 检查R2桶
    console.log('\nR2存储桶列表:');
    execSync('npx wrangler r2 bucket list', { stdio: 'inherit' });
  } catch (error) {
    console.error('检查配置失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('===== R2存储测试脚本 =====');
  
  // 获取参数
  const args = process.argv.slice(2);
  const production = args.includes('--production');
  const deleteFiles = args.includes('--delete');
  const downloadOnly = args.includes('--download');
  
  // 检查配置
  checkConfiguration();
  
  if (downloadOnly) {
    // 仅下载文件
    downloadFile('test.txt', production);
    downloadFile('config.json', production);
    downloadFile('random.bin', production);
  } else {
    // 正常测试流程
    const files = createTestFiles();
    uploadFiles(files, production);
    listFiles(production);
    
    // 下载一个文件进行测试
    downloadFile('test.txt', production);
    
    // 如果指定了删除参数，删除文件
    if (deleteFiles) {
      deleteFile('test.txt', production);
      deleteFile('config.json', production);
      deleteFile('random.bin', production);
    }
  }
  
  console.log('\n===== 测试完成 =====');
}

main().catch(error => {
  console.error('测试过程中出错:', error);
  process.exit(1);
}); 