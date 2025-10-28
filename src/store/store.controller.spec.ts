// store.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { S3Service } from '../s3/s3.service';
import type { AuthUser } from '../auth/auth.types';
import { UserType } from '@prisma/client';

describe('StoreController', () => {
  let controller: StoreController;
  let service: jest.Mocked<StoreService>;
  let s3: jest.Mocked<S3Service>;

  const mockService: jest.Mocked<StoreService> = {
    createStore: jest.fn(),
    updateStore: jest.fn(),
    getStoreDetail: jest.fn(),
    getMyStoreDetail: jest.fn(),
    getMyStoreProducts: jest.fn(),
    registerInterestStore: jest.fn(),
    deleteInterestStore: jest.fn(),
  } as any;

  const mockS3: jest.Mocked<S3Service> = {
    uploadFile: jest.fn(),
  } as any;

  const req = (over?: Partial<AuthUser>) => ({
    user: { userId: 'u1', type: UserType.SELLER, ...(over ?? {}) } as AuthUser,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        { provide: StoreService, useValue: mockService },
        { provide: S3Service, useValue: mockS3 },
      ],
    }).compile();

    controller = module.get(StoreController);
    service = module.get(StoreService) as any;
    s3 = module.get(S3Service) as any;

    jest.clearAllMocks();
  });

  describe('스토어 등록', () => {
    const dto = {
      name: 'New Store',
      address: '서울특별시 용산구',
      detailAddress: '서빙고로 137',
      phoneNumber: '02-0000-0000',
      content: '트렌디한 백자를 판매합니다.',
    };

    const createdStore = {
      id: 's1',
      name: 'New Store',
      address: '서울특별시 용산구',
      detailAddress: '서빙고로 137',
      phoneNumber: '02-0000-0000',
      content: '트렌디한 백자를 판매합니다.',
      image: 'https://bucket.s3.ap-northeast-2.amazonaws.com/upload/x.jpg',
      createdAt: new Date('2025-10-28T01:23:45.000Z'),
      updatedAt: new Date('2025-10-28T01:23:45.000Z'),
    } as any;

    it('파일 없이 생성', async () => {
      service.createStore.mockResolvedValue({ ...createdStore, image: null });

      const res = await controller.create(req(), undefined, { ...dto });

      expect(s3.uploadFile).not.toHaveBeenCalled();
      expect(service.createStore).toHaveBeenCalledWith('u1', UserType.SELLER, {
        ...dto,
        image: undefined,
      });

      expect(res).toEqual({
        id: createdStore.id,
        storeName: createdStore.name,
        phoneNumber: createdStore.phoneNumber,
        description: createdStore.content,
        address: {
          basic: createdStore.address,
          detail: createdStore.detailAddress,
        },
        image: undefined,
        createdAt: createdStore.createdAt,
        updatedAt: createdStore.updatedAt,
      });
    });

    it('파일 포함 생성, S3 업로드 URL이 DTO.image에 반영', async () => {
      const file = {
        originalname: 'a.jpg',
        mimetype: 'image/jpeg',
        size: 1234,
        buffer: Buffer.from('x'),
      } as Express.Multer.File;

      s3.uploadFile.mockResolvedValue({
        message: '업로드 성공',
        url: createdStore.image,
        key: 'upload/x.jpg',
      });

      service.createStore.mockResolvedValue(createdStore);

      const res = await controller.create(req(), file, { ...dto });

      expect(s3.uploadFile).toHaveBeenCalledWith(file);
      expect(service.createStore).toHaveBeenCalledWith('u1', UserType.SELLER, {
        ...dto,
        image: createdStore.image,
      });

      expect(res).toEqual({
        id: createdStore.id,
        storeName: createdStore.name,
        phoneNumber: createdStore.phoneNumber,
        description: createdStore.content,
        address: {
          basic: createdStore.address,
          detail: createdStore.detailAddress,
        },
        image: createdStore.image,
        createdAt: createdStore.createdAt,
        updatedAt: createdStore.updatedAt,
      });
    });
  });

  it('내 스토어 상세 조회', async () => {
    service.getMyStoreDetail.mockResolvedValue({ id: 's1' } as any);
    await controller.getMyStoreDetail({
      user: { userId: 'u1', type: UserType.SELLER } as AuthUser,
    });
    expect(service.getMyStoreDetail).toHaveBeenCalledWith(
      'u1',
      UserType.SELLER,
    );
  });

  it('스토어에 등록된 상품 목록 조회', async () => {
    service.getMyStoreProducts.mockResolvedValue({ list: [], totalCount: 0 });
    const query = { page: 2, pageSize: 5 } as any;
    await controller.getMyStoreProducts(
      { user: { userId: 'u1', type: UserType.SELLER } as AuthUser },
      query,
    );
    expect(service.getMyStoreProducts).toHaveBeenCalledWith(
      'u1',
      UserType.SELLER,
      query,
    );
  });

  it('스토어 상세 조회', async () => {
    service.getStoreDetail.mockResolvedValue({ id: 's1' } as any);
    await controller.getStoreDetail('s1');
    expect(service.getStoreDetail).toHaveBeenCalledWith('s1');
  });

  it('스토어 수정', async () => {
    service.updateStore.mockResolvedValue({ id: 's1' } as any);
    const dto = { name: 'new' } as any;
    await controller.updateStore(
      's1',
      { user: { userId: 'u1', type: UserType.SELLER } } as any,
      dto,
    );
    expect(service.updateStore).toHaveBeenCalledWith(
      's1',
      'u1',
      UserType.SELLER,
      dto,
    );
  });

  it('관심 스토어 등록', async () => {
    service.registerInterestStore.mockResolvedValue({
      store: { id: 's1' } as any,
    });
    await controller.registerInterestStore('s1', {
      user: { userId: 'u1', type: UserType.SELLER } as AuthUser,
    });
    expect(service.registerInterestStore).toHaveBeenCalledWith('s1', 'u1');
  });

  it('관심 스토어 해제', async () => {
    service.deleteInterestStore.mockResolvedValue({
      store: { id: 's1' } as any,
    });
    await controller.deleteInterestStore('s1', {
      user: { userId: 'u1', type: UserType.SELLER } as AuthUser,
    });
    expect(service.deleteInterestStore).toHaveBeenCalledWith('s1', 'u1');
  });
});
