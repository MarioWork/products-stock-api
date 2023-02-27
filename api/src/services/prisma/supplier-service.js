//TODO: add docs
const createSupplier = (prisma, { nif, name, createdBy }) =>
    prisma.supplier.create({ data: { nif, name, createdBy: { connect: { id: createdBy } } } });

//TODO: add docs
const getAllSuppliers = (prisma, { filter, pagination }) => {
    const where = {
        name: {
            contains: filter,
            mode: 'insensitive'
        }
    };
    return Promise.all([
        prisma.supplier.findMany({
            where,
            take: pagination.pageSize,
            skip: pagination.pastRecordsCount
        }),
        prisma.supplier.count({ where })
    ]);
};

//TODO: add docs
const getSupplierById = (prisma, id) => prisma.supplier.findUnique({ where: { id } });

//TODO: add docs
const updateSupplier = (prisma, { id, name, nif }) =>
    prisma.supplier.update({ where: { id }, data: { name, nif } });

//TODO: add docs
const deleteSuppliers = (prisma, ids) => prisma.supplier.deleteMany({ where: { id: { in: ids } } });

/**
 * Returns all products of a certain supplier paginated and the total amount of records
 * @param {PrismaClient} prisma - ORM Dependency
 * @param {{id: string, pagination: Pagination}} obj
 * @returns {Promise}
 */
const getAllSupplierProducts = (prisma, { id, pagination }) => {
    const select = {
        id: true,
        name: true,
        quantity: true,
        images: {
            select: { url: true }
        },
        categories: { select: { id: true, name: true } }
    };

    return Promise.all([
        prisma.supplier.findUnique({
            where: { id },
            select: {
                products: {
                    select,
                    take: pagination.pageSize,
                    skip: pagination.pastRecordsCount
                }
            }
        }),
        prisma.product.count({ where: { supplierId: id } })
    ]);
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSuppliers,
    getAllSupplierProducts
};
