require('dotenv').config();
const util = require('util');
const { pipeline } = require('stream');
const { randomUUID } = require('crypto');

const pipelineAsync = util.promisify(pipeline);

const fp = require('fastify-plugin');

const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const { PluginNames } = require('../enums/plugins');
const serviceAccount = require('../../credentials.json');

const plugin = async server => {
    server.log.info(`Registering ${PluginNames.FIREBASE} plugin...`);

    try {
        initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.STORAGE_BUCKET
        });

        const storageBucket = getStorage().bucket();

        server.decorate('saveFile', async (file, filename) => {
            const randomID = randomUUID();
            const fileRef = storageBucket.file('images/' + randomID + '/' + filename);

            await pipelineAsync(file, fileRef.createWriteStream(filename));

            return 'http://127.0.0.1/api/image/' + randomID + '&filename=' + filename;
        });

        server.decorate('downloadFile', async (fileId, fileName) => {
            return await storageBucket.file('images/' + fileId + '/' + fileName).download();
        });
    } catch (error) {
        server.log.error(error);
    }
};

const options = { name: PluginNames.FIREBASE };

module.exports = fp(plugin, options);
