import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMG = /\.(jpg|jpeg|gif|png)(\?v=\d+\.\d+\.\d+)?$/;

function handleFileUpload(file) {
  return new Promise((resolve, reject) => {
    const nameFile = file.hapi.filename.replace(' ', '_');
    const path = __dirname + '/uploads/' + nameFile;
    const fileStream = createWriteStream(path);

    fileStream.on('error', (err) => reject(err));
    fileStream.on('finish', () => resolve({
      [nameFile]: 'http://localhost:3000/uploads/' + nameFile,
    }));
    file.pipe(fileStream);
  });
}

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
        headers: [
          'Accept',
          'Authorization',
          'Content-Type',
          'If-None-Match',
        ],
        credentials: true,
        additionalHeaders: ['X-Requested-With'],
      },
    },
  });

  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return 'Hello, world!';
    }
  });

  server.route({
    method: 'GET',
    path: '/uploads/{path*}',
    handler: (request, h) => {
      console.log('####: request.path', request.path);
      if (IMG.test(request.path)) {
        return h.file(join(process.cwd(), request.path));
      }

      return 'Not Found';
    }
  });

  server.route({
    method: 'POST',
    path: '/upload',
    handler: async (request, h) => {
      const { files } = request.payload;
      const result = [];

      for (const file of files) {

        const path = await handleFileUpload(file);
        result.push(path);
      }
      return result;
    },
    options: {
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        allow: 'multipart/form-data',
        maxBytes: 1048576 * 10,
      }
    }
  })

  await server.start();
  console.log('Server running on %s', server.info.uri);
}

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

init();
