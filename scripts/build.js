const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

async function build() {
    // Create dist directory
    await fs.ensureDir('dist');
    
    // Copy static assets
    await fs.copy('static', 'dist');
    
    // Build pages
    const contentDir = path.join(__dirname, '../src/content');
    const templatePath = path.join(__dirname, '../templates/base.html');
    
    // Ensure template exists
    if (!await fs.pathExists(templatePath)) {
        throw new Error('Template file not found: ' + templatePath);
    }
    
    const template = await fs.readFile(templatePath, 'utf-8');
    
    // Process markdown files
    async function processMarkdown(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const { attributes, body } = frontMatter(content);
        const html = marked(body);
        return template
            .replace('{{title}}', attributes.title || 'Untitled')
            .replace('{{content}}', html);
    }

    // Create index.html
    const indexPath = path.join(__dirname, '../index.html');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    const mainContent = indexContent.match(/<main>([\s\S]*)<\/main>/)[1];

    await fs.writeFile(
        'dist/index.html',
        template
            .replace('{{title}}', 'Home')
            .replace('{{content}}', mainContent)
    );

    // Process blog posts
    const blogDir = path.join(contentDir, 'blog');
    if (await fs.pathExists(blogDir)) {
        // Create blog directory in dist
        await fs.ensureDir(path.join(__dirname, '../dist/blog'));

        const blogFiles = await fs.readdir(blogDir);
        console.log('Processing blog files:', blogFiles);

        // Process each blog post
        for (const file of blogFiles) {
            if (file.endsWith('.md')) {
                const html = await processMarkdown(path.join(blogDir, file));
                const outputFile = path.join(__dirname, '../dist/blog', file.replace('.md', '.html'));
                await fs.writeFile(outputFile, html);
                console.log('Created blog post:', outputFile);
            }
        }

        // Create blog index page
        const blogIndexContent = `
            <h1>Blog Posts</h1>
            <ul class="post-list">
                ${blogFiles
                    .filter(file => file.endsWith('.md'))
                    .map(file => {
                        const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
                        const { attributes } = frontMatter(content);
                        const postName = file.replace('.md', '');
                        return `
                            <li>
                                <h2><a href="/blog/${postName}">${attributes.title}</a></h2>
                                <p>Published: ${attributes.date}</p>
                            </li>
                        `;
                    })
                    .join('')}
            </ul>
        `;

        const blogIndexPath = path.join(__dirname, '../dist/blog/index.html');
        await fs.writeFile(
            blogIndexPath,
            template
                .replace('{{title}}', 'Blog')
                .replace('{{content}}', blogIndexContent)
        );
        console.log('Created blog index:', blogIndexPath);
    }
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
}); 