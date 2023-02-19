const { userSchema } = require('../../../schemas/user-schema');

const { UserRoles } = require('../../../enums/user-roles');
const { AllowedFileType } = require('../../../enums/allowed-file-type');

const { authorize } = require('../../../controllers/user-controller');
const { addProfilePicture } = require('../../../controllers/user-controller');

const schema = {
    response: {
        200: userSchema
    }
};
const options = ({ prisma, authService }) => ({
    schema,
    preValidation: authorize({ prisma, authService }, [UserRoles.ADMIN, UserRoles.EMPLOYEE])
});

module.exports = async server => {
    const { prisma, storage, to, authService } = server;

    server.post('/', options({ prisma, authService }), async (request, reply) => {
        const data = await request.file();

        //If there is not file content
        if (!data?.filename) {
            await reply.badRequest('Missing file content');
            return;
        }

        const { mimetype, file } = data;

        const fileType = mimetype.split('/')[1]?.toLowerCase();

        //If the file type is not allowed
        if (!Object.values(AllowedFileType).includes(fileType)) {
            await reply.badRequest('File type not allowed');
            return;
        }

        const [error, user] = await to(
            addProfilePicture({ prisma, storage }, { userId: request.user?.id, file, fileType })
        );

        if (error) {
            server.log.error(error);
            await reply.internalServerError();
            return;
        }

        await reply.code(200).send(user);
    });
};
