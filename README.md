# my-vue-app

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).


## pages要求
node:18.17.1
npm:9.6.7


npm install hono --save-dev


## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```


https://developers.cloudflare.com/pages/framework-guides/deploy-a-vue-site/

npm create cloudflare@latest -- my-vue-app --framework=vue --platform=pages


git config --global user.email "jackadam1981@hotmail.com"
git config --global user.name "jack"

echo "# pages-template_vue-hono" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/jackadam1981/pages-template_vue-hono.git
git push -u origin main

Download and install the latest Microsoft Visual C++ Redistributable package. You can get it from the official Microsoft website:
Visit: https://aka.ms/vs/17/release/vc_redist.x64.exe
This will download the latest Visual C++ Redistributable for x64 systems

本地开发：
开发者复制 wrangler.example.toml 为 wrangler.toml
填入本地开发用的数据库 ID
使用 wrangler dev 进行本地开发
生产部署：
在 Cloudflare Dashboard 的 Pages 设置中配置数据库绑定
使用 wrangler pages deploy 部署
生产环境的数据库 ID 完全通过 Dashboard 管理