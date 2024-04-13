import { extname } from 'https://deno.land/std@0.201.0/path/extname.ts';

Deno.serve({
    port: 8140,
    handler: async (request) => {
        const url = new URL(request.url);

        console.log(`request ${url.pathname}`);
    
        let filePath = `.${url.pathname}`;
        if (filePath === './') {
            filePath = './index.html';
        }

        if (filePath === './favicon.ico') {
            return new Response(null, {
                status: 404
            });
        }
    
        const extstr = String(extname(filePath)).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.wav': 'audio/wav',
          '.mp4': 'video/mp4',
          '.woff': 'application/font-woff',
          '.ttf': 'application/font-ttf',
          '.eot': 'application/vnd.ms-fontobject',
          '.otf': 'application/font-otf',
          '.wasm': 'application/wasm',
        };
    
        const contentType = mimeTypes[extstr] ?? 'application/octet-stream';
        const content = await Deno.readFile(filePath);

        return new Response(content, {
            status: 200,
            headers: { 'Content-Type': contentType }
        });
    }
});

console.log('Server running at http://127.0.0.1:8140/');