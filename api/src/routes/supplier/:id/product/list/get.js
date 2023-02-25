const S = require('fluent-json-schema');

const { supplierIdSchema } = require('../../../../../schemas/supplier-schema');
const { productSchema } = require('../../../../../schemas/product-schema');
const { paginationMetadataSchema } = require('../../../../../schemas/pagination-metadata-schema');

const { UserRoles } = require('../../../../../enums/user-roles');

const { authorize } = require('../../../../../controllers/user-controller');
const { getAllSupplierProducts } = require('../../../../../controllers/supplier-controller');

const schema = {
    response: {
        206: S.object()
            .prop('_metadata', paginationMetadataSchema)
            .prop('data', S.array().items(productSchema))
            .required(['data'])
    },
    params: S.object().prop('id', supplierIdSchema).required(['id'])
};

const options = ({ prisma, authService }) => ({
    schema,
    preValidation: authorize({ authService, prisma }, [UserRoles.EMPLOYEE, UserRoles.ADMIN])
});

module.exports = async server => {
    const { prisma, to, authService } = server;

    server.get('/', options({ prisma, authService }), async (request, reply) => {
        const { id } = request.params;
        const pagination = request.parsePaginationQuery();

        const [error, result] = await to(getAllSupplierProducts(prisma, { id, pagination }));
        const [products, total] = result;

        if (error) {
            server.log.error(error);
            await reply.internalServerError();
            return;
        }

        await reply.withPagination({ total, page: pagination.currentPage, data: products });
    });
};
