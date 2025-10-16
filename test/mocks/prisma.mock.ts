export const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  pointTransaction: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
};
